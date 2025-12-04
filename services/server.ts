
import { db } from './storage';
import { User, UserRole, Course, Module, Lesson, LogEntry, ResourceFile, ResourceFolder, AuthSession, ApiResponse } from '../types';
import { MOCK_ADMIN_CREDS } from '../constants';

// --- SERVER UTILITIES ---

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateToken = () => 'tk_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);

// --- MIDDLEWARE SIMULATION ---

const getSession = (token: string): AuthSession | null => {
  const sessions = db.sessions.getAll();
  const session = sessions.find((s: AuthSession) => s.token === token);
  if (!session || session.expiresAt < Date.now()) return null;
  return session;
};

const getUserFromToken = (token: string): User | null => {
  const session = getSession(token);
  if (!session) return null;
  const users = db.users.getAll();
  return users.find((u: User) => u.id === session.userId) || null;
};

const logSystemAction = (user: User | null, action: string, details: string, resourceId?: string) => {
  const entry: LogEntry = {
    id: generateId(),
    userId: user ? user.id : 'system',
    username: user ? user.username : 'system',
    action,
    details,
    resourceId,
    timestamp: new Date().toISOString(),
    ip: '192.168.1.X' // Mock IP
  };
  db.logs.add(entry);
};

// Response Helper
const success = <T>(data: T): ApiResponse<T> => ({ data, status: 200 });
const error = (msg: string, status: number = 400): ApiResponse<any> => ({ error: msg, status });
const unauthorized = (): ApiResponse<any> => ({ error: 'Не авторизован', status: 401 });
const forbidden = (): ApiResponse<any> => ({ error: 'Доступ запрещен', status: 403 });

// --- CONTROLLERS ---

export const server = {
  
  auth: {
    async login(username: string, password: string): Promise<ApiResponse<{ token: string, user: User }>> {
      await new Promise(r => setTimeout(r, 400));
      let user: User | undefined;

      if (username === MOCK_ADMIN_CREDS.username && password === MOCK_ADMIN_CREDS.password) {
        const users = db.users.getAll();
        let admin = users.find((u: User) => u.role === UserRole.ADMIN);
        if (!admin) {
          admin = {
            id: 'admin-001',
            username: MOCK_ADMIN_CREDS.username,
            fullName: 'Администратор Системы',
            role: UserRole.ADMIN,
            createdAt: new Date().toISOString()
          };
          db.users.setAll([...users, admin]);
        }
        user = admin;
      } else {
        const users = db.users.getAll();
        user = users.find((u: User) => u.username === username);
        if (!user) return error('Неверные учетные данные', 401);
      }

      const token = generateToken();
      const session: AuthSession = {
        token,
        userId: user.id,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      };
      
      const sessions = db.sessions.getAll();
      db.sessions.setAll([...sessions, session]);
      
      logSystemAction(user, 'LOGIN', 'Пользователь вошел в систему');
      return success({ token, user });
    },

    async logout(token: string): Promise<ApiResponse<void>> {
      const sessions = db.sessions.getAll();
      db.sessions.setAll(sessions.filter((s: AuthSession) => s.token !== token));
      return success(undefined);
    },

    async me(token: string): Promise<ApiResponse<User>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();
      return success(user);
    }
  },

  courses: {
    async list(token: string): Promise<ApiResponse<Course[]>> {
      await new Promise(r => setTimeout(r, 300));
      const user = getUserFromToken(token);
      if (!user) return unauthorized();
      const courses = db.courses.getAll();
      if (user.role === UserRole.ADMIN) {
        return success(courses);
      } else {
        return success(courses.filter((c: Course) => c.authorId === user.id));
      }
    },

    async get(token: string, id: string): Promise<ApiResponse<{ course: Course, modules: Module[], lessons: Lesson[] }>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const courses = db.courses.getAll();
      const course = courses.find((c: Course) => c.id === id);

      if (!course) return error('Курс не найден', 404);
      if (user.role !== UserRole.ADMIN && course.authorId !== user.id) return forbidden();

      const modules = db.modules.getAll().filter((m: Module) => m.courseId === id).sort((a: any, b: any) => a.order - b.order);
      const lessons = db.lessons.getAll().filter((l: Lesson) => modules.some((m: Module) => m.id === l.moduleId)).sort((a: any, b: any) => a.order - b.order);

      return success({ course, modules, lessons });
    },

    async create(token: string, data: Partial<Course>): Promise<ApiResponse<Course>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const newCourse: Course = {
        id: generateId(),
        authorId: user.id,
        title: data.title || 'Новый курс',
        description: data.description || '',
        isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      };

      const courses = db.courses.getAll();
      db.courses.setAll([...courses, newCourse]);
      logSystemAction(user, 'CREATE_COURSE', `Создан курс ${newCourse.title}`, newCourse.id);
      
      return success(newCourse);
    },

    async update(token: string, id: string, updates: Partial<Course>): Promise<ApiResponse<Course>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const courses = db.courses.getAll();
      const idx = courses.findIndex((c: Course) => c.id === id);
      if (idx === -1) return error('Курс не найден', 404);

      const existing = courses[idx];
      if (user.role !== UserRole.ADMIN && existing.authorId !== user.id) return forbidden();

      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      courses[idx] = updated;
      db.courses.setAll(courses);
      
      logSystemAction(user, 'UPDATE_COURSE', `Обновлен курс ${updated.title}`, id);
      return success(updated);
    },

    async delete(token: string, id: string): Promise<ApiResponse<void>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const courses = db.courses.getAll();
      const course = courses.find((c: Course) => c.id === id);
      if (!course) return error('Курс не найден', 404);

      if (user.role !== UserRole.ADMIN && course.authorId !== user.id) return forbidden();

      db.courses.setAll(courses.filter((c: Course) => c.id !== id));
      
      const modules = db.modules.getAll().filter((m: Module) => m.courseId === id);
      const moduleIds = modules.map((m: Module) => m.id);
      db.modules.setAll(db.modules.getAll().filter((m: Module) => m.courseId !== id));
      db.lessons.setAll(db.lessons.getAll().filter((l: Lesson) => !moduleIds.includes(l.moduleId)));

      logSystemAction(user, 'DELETE_COURSE', `Удален курс ${course.title}`, id);
      return success(undefined);
    },

    async logExport(token: string, courseId: string, format: string): Promise<ApiResponse<void>> {
        const user = getUserFromToken(token);
        if (!user) return unauthorized();
        
        const courses = db.courses.getAll();
        const course = courses.find((c: Course) => c.id === courseId);
        if(!course) return error("Курс не найден", 404);

        if (user.role !== UserRole.ADMIN && course.authorId !== user.id) return forbidden();

        logSystemAction(user, 'EXPORT_COURSE', `Экспорт курса ${course.title} в формат ${format}`, courseId);
        return success(undefined);
    }
  },

  modules: {
    async create(token: string, courseId: string): Promise<ApiResponse<Module>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const courses = db.courses.getAll();
      const course = courses.find((c: Course) => c.id === courseId);
      if (!course) return error('Курс не найден', 404);
      if (user.role !== UserRole.ADMIN && course.authorId !== user.id) return forbidden();

      const currentModules = db.modules.getAll().filter((m: Module) => m.courseId === courseId);

      const newModule: Module = {
        id: generateId(),
        courseId,
        title: 'Новый модуль',
        order: currentModules.length
      };

      db.modules.setAll([...db.modules.getAll(), newModule]);
      return success(newModule);
    },

    async update(token: string, id: string, updates: Partial<Module>): Promise<ApiResponse<Module>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const modules = db.modules.getAll();
      const idx = modules.findIndex((m: Module) => m.id === id);
      if (idx === -1) return error('Модуль не найден', 404);

      const course = db.courses.getAll().find((c: Course) => c.id === modules[idx].courseId);
      if (!course) return error('Курс не найден', 404);
      if (user.role !== UserRole.ADMIN && course.authorId !== user.id) return forbidden();

      modules[idx] = { ...modules[idx], ...updates };
      db.modules.setAll(modules);
      return success(modules[idx]);
    }
  },

  lessons: {
    async create(token: string, moduleId: string): Promise<ApiResponse<Lesson>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const module = db.modules.getAll().find((m: Module) => m.id === moduleId);
      if (!module) return error('Модуль не найден', 404);

      const course = db.courses.getAll().find((c: Course) => c.id === module.courseId);
      if (user.role !== UserRole.ADMIN && course.authorId !== user.id) return forbidden();

      const siblings = db.lessons.getAll().filter((l: Lesson) => l.moduleId === moduleId);
      const newLesson: Lesson = {
        id: generateId(),
        moduleId,
        title: 'Новый урок',
        order: siblings.length,
        blocks: []
      };

      db.lessons.setAll([...db.lessons.getAll(), newLesson]);
      logSystemAction(user, 'CREATE_LESSON', `Создан урок ${newLesson.title}`, newLesson.id);
      return success(newLesson);
    },

    async update(token: string, id: string, updates: Partial<Lesson>): Promise<ApiResponse<Lesson>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const lessons = db.lessons.getAll();
      const idx = lessons.findIndex((l: Lesson) => l.id === id);
      if (idx === -1) return error('Урок не найден', 404);

      const module = db.modules.getAll().find((m: Module) => m.id === lessons[idx].moduleId);
      const course = db.courses.getAll().find((c: Course) => c.id === module?.courseId);
      if (!course) return error('Ошибка иерархии курса', 500);
      if (user.role !== UserRole.ADMIN && course.authorId !== user.id) return forbidden();

      lessons[idx] = { ...lessons[idx], ...updates };
      db.lessons.setAll(lessons);
      
      logSystemAction(user, 'UPDATE_LESSON', `Обновлен урок ${lessons[idx].title}`, id);
      return success(lessons[idx]);
    },

    async get(token: string, id: string): Promise<ApiResponse<Lesson>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const lesson = db.lessons.getAll().find((l: Lesson) => l.id === id);
      if (!lesson) return error('Урок не найден', 404);
      
      const module = db.modules.getAll().find((m: Module) => m.id === lesson.moduleId);
      const course = db.courses.getAll().find((c: Course) => c.id === module?.courseId);
      
      if (user.role !== UserRole.ADMIN && course?.authorId !== user.id) return forbidden();
      
      return success(lesson);
    }
  },

  folders: {
    async create(token: string, name: string, parentId: string | null): Promise<ApiResponse<ResourceFolder>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const newFolder: ResourceFolder = {
        id: generateId(),
        parentId,
        ownerId: user.id,
        name,
        path: parentId ? '...' : '/', // Simplification
        createdAt: new Date().toISOString()
      };

      db.folders.setAll([...db.folders.getAll(), newFolder]);
      logSystemAction(user, 'CREATE_FOLDER', `Создана папка ${name}`, newFolder.id);
      return success(newFolder);
    },

    async list(token: string, parentId: string | null): Promise<ApiResponse<ResourceFolder[]>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const all = db.folders.getAll();
      let filtered = all.filter((f: ResourceFolder) => f.parentId === parentId);
      
      if (user.role !== UserRole.ADMIN) {
        filtered = filtered.filter((f: ResourceFolder) => f.ownerId === user.id);
      }
      return success(filtered);
    },

    async delete(token: string, id: string): Promise<ApiResponse<void>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const allFolders = db.folders.getAll();
      const folder = allFolders.find((f: ResourceFolder) => f.id === id);
      if (!folder) return error('Папка не найдена', 404);
      if (user.role !== UserRole.ADMIN && folder.ownerId !== user.id) return forbidden();

      // Recursive Delete Logic
      const idsToDelete = new Set<string>();
      const collectIds = (fid: string) => {
        idsToDelete.add(fid);
        // Find subfolders
        const children = allFolders.filter((f: ResourceFolder) => f.parentId === fid);
        children.forEach((c: ResourceFolder) => collectIds(c.id));
      };
      collectIds(id);

      // Delete folders
      db.folders.setAll(allFolders.filter((f: ResourceFolder) => !idsToDelete.has(f.id)));

      // Delete files in these folders
      const allFiles = db.resources.getAll();
      db.resources.setAll(allFiles.filter((f: ResourceFile) => f.parentId === null || !idsToDelete.has(f.parentId)));

      logSystemAction(user, 'DELETE_FOLDER', `Удалена папка ${folder.name}`, id);
      return success(undefined);
    },

    async rename(token: string, id: string, name: string): Promise<ApiResponse<ResourceFolder>> {
       // Placeholder for future rename capability
       return error('Not implemented', 501);
    }
  },

  resources: {
    async upload(token: string, file: File, parentId: string | null = null, bindToLessonId?: string): Promise<ApiResponse<ResourceFile>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const resource: ResourceFile = {
            id: generateId(),
            uploaderId: user.id,
            parentId,
            name: file.name,
            type: file.type,
            size: file.size,
            url: reader.result as string, 
            usageReferences: bindToLessonId ? [bindToLessonId] : [],
            createdAt: new Date().toISOString()
          };
          db.resources.setAll([resource, ...db.resources.getAll()]);
          logSystemAction(user, 'UPLOAD_FILE', `Загружен файл ${file.name}`, resource.id);
          resolve(success(resource));
        };
        reader.readAsDataURL(file);
      });
    },

    async list(token: string, parentId: string | null = null): Promise<ApiResponse<ResourceFile[]>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const all = db.resources.getAll();
      let filtered = all.filter((r: ResourceFile) => r.parentId === parentId);

      if (user.role === UserRole.ADMIN) return success(filtered);
      return success(filtered.filter((r: ResourceFile) => r.uploaderId === user.id));
    },

    async delete(token: string, id: string): Promise<ApiResponse<void>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();

      const all = db.resources.getAll();
      const resource = all.find((r: ResourceFile) => r.id === id);
      if (!resource) return error('Не найдено', 404);

      if (user.role !== UserRole.ADMIN && resource.uploaderId !== user.id) return forbidden();

      db.resources.setAll(all.filter((r: ResourceFile) => r.id !== id));
      logSystemAction(user, 'DELETE_FILE', `Удален файл ${resource.name}`, id);
      return success(undefined);
    },

    async bind(token: string, fileId: string, lessonId: string): Promise<ApiResponse<void>> {
      const user = getUserFromToken(token);
      if (!user) return unauthorized();
      
      const all = db.resources.getAll();
      const idx = all.findIndex((r: ResourceFile) => r.id === fileId);
      if (idx === -1) return error('Файл не найден', 404);

      if (!all[idx].usageReferences.includes(lessonId)) {
        all[idx].usageReferences.push(lessonId);
        db.resources.setAll(all);
      }
      return success(undefined);
    }
  },

  admin: {
    async listUsers(token: string): Promise<ApiResponse<User[]>> {
      const user = getUserFromToken(token);
      if (!user || user.role !== UserRole.ADMIN) return forbidden();
      return success(db.users.getAll());
    },

    async createUser(token: string, newUser: Partial<User>): Promise<ApiResponse<User>> {
      const user = getUserFromToken(token);
      if (!user || user.role !== UserRole.ADMIN) return forbidden();

      const u: User = {
        id: generateId(),
        username: newUser.username!,
        fullName: newUser.fullName!,
        role: newUser.role || UserRole.INSTRUCTOR,
        createdAt: new Date().toISOString()
      };
      
      db.users.setAll([...db.users.getAll(), u]);
      logSystemAction(user, 'CREATE_USER', `Создан пользователь ${u.username}`, u.id);
      return success(u);
    },

    async deleteUser(token: string, userId: string): Promise<ApiResponse<void>> {
      const user = getUserFromToken(token);
      if (!user || user.role !== UserRole.ADMIN) return forbidden();

      db.users.setAll(db.users.getAll().filter((u: User) => u.id !== userId));
      logSystemAction(user, 'DELETE_USER', `Удален пользователь ${userId}`);
      return success(undefined);
    },

    async getLogs(token: string): Promise<ApiResponse<LogEntry[]>> {
      const user = getUserFromToken(token);
      if (!user || user.role !== UserRole.ADMIN) return forbidden();
      return success(db.logs.getAll());
    }
  }
};
