import { supabase } from '../lib/supabaseClient';
import { User, UserRole, Course, Module, Lesson, LogEntry, ResourceFile, ResourceFolder, AuthSession, ApiResponse } from '../types';
import { MOCK_ADMIN_CREDS } from '../constants';

// --- SERVER UTILITIES ---

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateToken = () => 'tk_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);

// --- HELPERS ---

const success = <T>(data: T): ApiResponse<T> => ({ data, status: 200 });
const error = (msg: string, status: number = 400): ApiResponse<any> => ({ error: msg, status });
const unauthorized = (): ApiResponse<any> => ({ error: 'Не авторизован', status: 401 });
const forbidden = (): ApiResponse<any> => ({ error: 'Доступ запрещен', status: 403 });

// --- DATA ACCESS LAYER (NoSQL over Postgres 'data' table) ---

// Helper to find rows where payload->collection == collectionName
const find = async <T>(collection: string, filter?: Record<string, any>) => {
  let query = supabase.from('data').select('payload').eq('payload->>collection', collection);
  
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      // Handle null checks explicitly if needed, but for now simple equality
      if (value === null) {
         // This is a limitation of the JSONB accessor syntax in simple queries, 
         // usually assumes string comparison. 
         // For 'parentId' which can be null, we might need a raw filter or fetch-and-filter.
         // Simpler strategy: fetch all for collection, filter in memory for edge cases.
      } else {
        query = query.eq(`payload->>${key}`, value);
      }
    });
  }

  const { data, error } = await query;
  if (error) {
    console.error('Supabase Find Error:', error);
    return [];
  }
  
  let results = data.map(row => row.payload as T);

  // In-memory filter for nulls or complex types that Supabase JSON->> operator handles as strings
  if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
          if (value === null) {
              // @ts-ignore
              results = results.filter(item => item[key] === null || item[key] === undefined);
          }
      });
  }

  return results;
};

// Helper to find a single item by its internal ID stored in payload
const findOne = async <T>(collection: string, id: string) => {
  const { data, error } = await supabase
    .from('data')
    .select('payload')
    .eq('payload->>collection', collection)
    .eq('payload->>id', id)
    .single();

  if (error || !data) return null;
  return data.payload as T;
};

// Helper to insert an item
const insert = async <T>(collection: string, item: any) => {
  const payload = { ...item, collection };
  const { error } = await supabase.from('data').insert({ payload });
  if (error) {
    console.error('Supabase Insert Error:', error);
    return null;
  }
  return item as T;
};

// Helper to update an item by its internal ID
const update = async <T>(collection: string, id: string, updates: Partial<T>) => {
  // 1. Get existing to merge
  const existing = await findOne<any>(collection, id);
  if (!existing) return null;

  const merged = { ...existing, ...updates, collection };
  
  // 2. Find the Postgres UUID row
  const { data: row } = await supabase
    .from('data')
    .select('id')
    .eq('payload->>collection', collection)
    .eq('payload->>id', id)
    .single();

  if (!row) return null;

  const { error } = await supabase
    .from('data')
    .update({ payload: merged })
    .eq('id', row.id);

  if (error) return null;
  return merged as T;
};

const remove = async (collection: string, id: string) => {
  // Find UUID first
  const { data: row } = await supabase
    .from('data')
    .select('id')
    .eq('payload->>collection', collection)
    .eq('payload->>id', id)
    .single();

  if (row) {
    await supabase.from('data').delete().eq('id', row.id);
  }
};


// Log system action
const logSystemAction = async (user: User | null, action: string, details: string, resourceId?: string) => {
  const entry: LogEntry = {
    id: generateId(),
    userId: user ? user.id : 'system',
    username: user ? user.username : 'system',
    action,
    details,
    resourceId,
    timestamp: new Date().toISOString(),
    ip: '127.0.0.1'
  };
  await insert('logs', entry);
};

// --- CONTROLLERS ---

export const server = {
  
  auth: {
    async login(username: string, password: string): Promise<ApiResponse<{ token: string, user: User }>> {
      let user: User | null = null;

      // Check if trying to login as hardcoded admin
      if (username === MOCK_ADMIN_CREDS.username && password === MOCK_ADMIN_CREDS.password) {
        // Check if admin exists in DB
        const users = await find<User>('users', { role: UserRole.ADMIN });
        const existingAdmin = users[0];
        
        if (!existingAdmin) {
          const newAdmin: User = {
            id: 'admin-001',
            username: MOCK_ADMIN_CREDS.username,
            fullName: 'Администратор Системы',
            role: UserRole.ADMIN,
            createdAt: new Date().toISOString()
          };
          await insert('users', newAdmin);
          user = newAdmin;
        } else {
          user = existingAdmin;
        }
      } else {
        // Regular user login
        const users = await find<User>('users', { username });
        user = users[0] || null;
      }

      if (!user) {
        return error('Неверные учетные данные', 401);
      }

      // Create Session
      const token = generateToken();
      const session: AuthSession = {
        token,
        userId: user.id,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      };
      
      await insert('sessions', session);
      await logSystemAction(user, 'LOGIN', 'Пользователь вошел в систему');
      
      return success({ token, user });
    },

    async logout(token: string): Promise<ApiResponse<void>> {
      // Find session by token and delete
      const { data: row } = await supabase
        .from('data')
        .select('id')
        .eq('payload->>collection', 'sessions')
        .eq('payload->>token', token)
        .single();

      if (row) await supabase.from('data').delete().eq('id', row.id);
      
      return success(undefined);
    },

    async me(token: string): Promise<ApiResponse<User>> {
      const sessions = await find<AuthSession>('sessions', { token });
      const session = sessions[0];
      
      if (!session || session.expiresAt < Date.now()) {
         return unauthorized();
      }

      const user = await findOne<User>('users', session.userId);
      if (!user) return unauthorized();
      
      return success(user);
    }
  },

  courses: {
    async list(token: string): Promise<ApiResponse<Course[]>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      let courses = await find<Course>('courses');
      
      if (authUser.role !== UserRole.ADMIN) {
        courses = courses.filter(c => c.authorId === authUser.id);
      }

      return success(courses);
    },

    async get(token: string, id: string): Promise<ApiResponse<{ course: Course, modules: Module[], lessons: Lesson[] }>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const course = await findOne<Course>('courses', id);
      if (!course) return error('Курс не найден', 404);

      if (authUser.role !== UserRole.ADMIN && course.authorId !== authUser.id) return forbidden();

      // Fetch Modules
      const allModules = await find<Module>('modules', { courseId: id });
      const modules = allModules.sort((a, b) => a.order - b.order);
      
      // Fetch Lessons
      const moduleIds = modules.map(m => m.id);
      const allLessons = await find<Lesson>('lessons');
      const lessons = allLessons
        .filter(l => moduleIds.includes(l.moduleId))
        .sort((a, b) => a.order - b.order);

      return success({ course, modules, lessons });
    },

    async create(token: string, data: Partial<Course>): Promise<ApiResponse<Course>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const newCourse: Course = {
        id: generateId(),
        authorId: authUser.id,
        title: data.title || 'Новый курс',
        description: data.description || '',
        isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      } as Course;

      await insert('courses', newCourse);
      await logSystemAction(authUser, 'CREATE_COURSE', `Создан курс ${newCourse.title}`, newCourse.id);
      return success(newCourse);
    },

    async update(token: string, id: string, updates: Partial<Course>): Promise<ApiResponse<Course>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const existing = await findOne<Course>('courses', id);
      if (!existing) return error('Курс не найден', 404);
      if (authUser.role !== UserRole.ADMIN && existing.authorId !== authUser.id) return forbidden();

      const updated = await update<Course>('courses', id, { ...updates, updatedAt: new Date().toISOString() });
      if (!updated) return error('Ошибка обновления');
      
      await logSystemAction(authUser, 'UPDATE_COURSE', `Обновлен курс ${updated.title}`, id);
      return success(updated);
    },

    async delete(token: string, id: string): Promise<ApiResponse<void>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const existing = await findOne<Course>('courses', id);
      if (!existing) return error('Курс не найден', 404);
      if (authUser.role !== UserRole.ADMIN && existing.authorId !== authUser.id) return forbidden();

      await remove('courses', id);
      // Note: We should ideally delete modules and lessons too, but keeping it simple for now
      
      await logSystemAction(authUser, 'DELETE_COURSE', `Удален курс ${existing.title}`, id);
      return success(undefined);
    },

    async logExport(token: string, courseId: string, format: string): Promise<ApiResponse<void>> {
        const { data: authUser } = await server.auth.me(token);
        if (!authUser) return unauthorized();
        
        await logSystemAction(authUser, 'EXPORT_COURSE', `Экспорт курса ${courseId} в формат ${format}`, courseId);
        return success(undefined);
    }
  },

  modules: {
    async create(token: string, courseId: string): Promise<ApiResponse<Module>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const course = await findOne<Course>('courses', courseId);
      if (!course) return error('Курс не найден', 404);
      if (authUser.role !== UserRole.ADMIN && course.authorId !== authUser.id) return forbidden();

      const modules = await find<Module>('modules', { courseId });
      
      const newModule: Module = {
        id: generateId(),
        courseId,
        title: 'Новый модуль',
        order: modules.length
      };

      await insert('modules', newModule);
      return success(newModule);
    },

    async update(token: string, id: string, updates: Partial<Module>): Promise<ApiResponse<Module>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const module = await findOne<Module>('modules', id);
      if (!module) return error('Модуль не найден', 404);

      const course = await findOne<Course>('courses', module.courseId);
      if (!course || (authUser.role !== UserRole.ADMIN && course.authorId !== authUser.id)) return forbidden();

      const updated = await update<Module>('modules', id, updates);
      if (!updated) return error('Ошибка');

      return success(updated);
    }
  },

  lessons: {
    async create(token: string, moduleId: string): Promise<ApiResponse<Lesson>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const module = await findOne<Module>('modules', moduleId);
      if (!module) return error('Модуль не найден', 404);

      const course = await findOne<Course>('courses', module.courseId);
      if (!course || (authUser.role !== UserRole.ADMIN && course.authorId !== authUser.id)) return forbidden();

      const lessons = await find<Lesson>('lessons', { moduleId });

      const newLesson: Lesson = {
        id: generateId(),
        moduleId,
        title: 'Новый урок',
        order: lessons.length,
        blocks: []
      };

      await insert('lessons', newLesson);
      await logSystemAction(authUser, 'CREATE_LESSON', `Создан урок ${newLesson.title}`, newLesson.id);
      return success(newLesson);
    },

    async update(token: string, id: string, updates: Partial<Lesson>): Promise<ApiResponse<Lesson>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const lesson = await findOne<Lesson>('lessons', id);
      if (!lesson) return error('Урок не найден', 404);

      const updated = await update<Lesson>('lessons', id, updates);
      if (!updated) return error('Ошибка');

      await logSystemAction(authUser, 'UPDATE_LESSON', `Обновлен урок ${updated.title}`, id);
      return success(updated);
    },

    async get(token: string, id: string): Promise<ApiResponse<Lesson>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const lesson = await findOne<Lesson>('lessons', id);
      if (!lesson) return error('Урок не найден', 404);
      
      return success(lesson);
    }
  },

  folders: {
    async create(token: string, name: string, parentId: string | null): Promise<ApiResponse<ResourceFolder>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const newFolder: ResourceFolder = {
        id: generateId(),
        parentId,
        ownerId: authUser.id,
        name,
        path: parentId ? '...' : '/',
        createdAt: new Date().toISOString()
      };

      await insert('folders', newFolder);
      await logSystemAction(authUser, 'CREATE_FOLDER', `Создана папка ${name}`, newFolder.id);
      return success(newFolder);
    },

    async list(token: string, parentId: string | null): Promise<ApiResponse<ResourceFolder[]>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const allFolders = await find<ResourceFolder>('folders');
      
      let folders = allFolders.filter(f => f.parentId === parentId);
      
      if (authUser.role !== UserRole.ADMIN) {
        folders = folders.filter(f => f.ownerId === authUser.id);
      }

      return success(folders);
    },

    async delete(token: string, id: string): Promise<ApiResponse<void>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const folder = await findOne<ResourceFolder>('folders', id);
      if (!folder) return error('Папка не найдена', 404);
      if (authUser.role !== UserRole.ADMIN && folder.ownerId !== authUser.id) return forbidden();

      await remove('folders', id);
      await logSystemAction(authUser, 'DELETE_FOLDER', `Удалена папка ${folder.name}`, id);
      return success(undefined);
    },

    async rename(token: string, id: string, name: string): Promise<ApiResponse<ResourceFolder>> {
        return error('Not implemented');
    }
  },

  resources: {
    async upload(token: string, file: File, parentId: string | null = null, bindToLessonId?: string): Promise<ApiResponse<ResourceFile>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async () => {
          const resource: ResourceFile = {
            id: generateId(),
            uploaderId: authUser.id,
            parentId,
            name: file.name,
            type: file.type,
            size: file.size,
            url: reader.result as string, 
            usageReferences: bindToLessonId ? [bindToLessonId] : [],
            createdAt: new Date().toISOString()
          };
          
          await insert('resources', resource);
          await logSystemAction(authUser, 'UPLOAD_FILE', `Загружен файл ${file.name}`, resource.id);
          resolve(success(resource));
        };
        reader.readAsDataURL(file);
      });
    },

    async list(token: string, parentId: string | null = null): Promise<ApiResponse<ResourceFile[]>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const allResources = await find<ResourceFile>('resources');
      
      let resources = allResources.filter(r => r.parentId === parentId);

      if (authUser.role !== UserRole.ADMIN) {
        resources = resources.filter(r => r.uploaderId === authUser.id);
      }

      return success(resources);
    },

    async delete(token: string, id: string): Promise<ApiResponse<void>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();

      const resource = await findOne<ResourceFile>('resources', id);
      if (!resource) return error('Не найдено', 404);

      if (authUser.role !== UserRole.ADMIN && resource.uploaderId !== authUser.id) return forbidden();

      await remove('resources', id);
      await logSystemAction(authUser, 'DELETE_FILE', `Удален файл ${resource.name}`, id);
      return success(undefined);
    },

    async bind(token: string, fileId: string, lessonId: string): Promise<ApiResponse<void>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser) return unauthorized();
      
      const resource = await findOne<ResourceFile>('resources', fileId);
      if (!resource) return error('Файл не найден', 404);

      const refs = resource.usageReferences || [];
      if (!refs.includes(lessonId)) {
        await update<ResourceFile>('resources', fileId, { usageReferences: [...refs, lessonId] });
      }
      return success(undefined);
    }
  },

  admin: {
    async listUsers(token: string): Promise<ApiResponse<User[]>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser || authUser.role !== UserRole.ADMIN) return forbidden();
      
      const users = await find<User>('users');
      return success(users);
    },

    async createUser(token: string, newUser: Partial<User>): Promise<ApiResponse<User>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser || authUser.role !== UserRole.ADMIN) return forbidden();

      const u: User = {
        id: generateId(),
        username: newUser.username!,
        fullName: newUser.fullName!,
        role: newUser.role || UserRole.INSTRUCTOR,
        createdAt: new Date().toISOString()
      };
      
      await insert('users', u);
      await logSystemAction(authUser, 'CREATE_USER', `Создан пользователь ${u.username}`, u.id);
      return success(u);
    },

    async deleteUser(token: string, userId: string): Promise<ApiResponse<void>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser || authUser.role !== UserRole.ADMIN) return forbidden();

      await remove('users', userId);
      await logSystemAction(authUser, 'DELETE_USER', `Удален пользователь ${userId}`);
      return success(undefined);
    },

    async getLogs(token: string): Promise<ApiResponse<LogEntry[]>> {
      const { data: authUser } = await server.auth.me(token);
      if (!authUser || authUser.role !== UserRole.ADMIN) return forbidden();
      
      const logs = await find<LogEntry>('logs');
      return success(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  }
};