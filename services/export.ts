
import { User, Course, Module, Lesson, BlockType } from '../types';
import { server } from './server';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';

// --- HELPER FUNCTIONS ---

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.href = url;
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
};

// --- HTML GENERATOR ---

const generateFullHTML = (data: { course: Course, modules: Module[], lessons: Lesson[] }): string => {
  const { course, modules, lessons } = data;
  
  let html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${course.title} - Полный экспорт курса</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #1e293b; background: #fff; line-height: 1.6; }
        h1 { font-size: 2.5em; border-bottom: 4px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; color: #0f172a; }
        .course-meta { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 40px; border: 1px solid #e2e8f0; }
        .module { margin-top: 60px; break-inside: avoid; page-break-before: always; }
        .module-header { background: #1e293b; color: white; padding: 16px 24px; border-radius: 8px; margin-bottom: 24px; }
        .module-title { font-size: 1.8em; font-weight: 700; margin: 0; }
        .lesson { margin-bottom: 40px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; break-inside: avoid; }
        .lesson-header { background: #f1f5f9; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; }
        .lesson-title { font-size: 1.4em; font-weight: 600; margin: 0; color: #334155; }
        .lesson-content { padding: 24px; }
        .block { margin-bottom: 24px; }
        
        /* Block Styles */
        .block-text { font-size: 1.1em; color: #334155; white-space: pre-wrap; }
        .block-image { text-align: center; }
        .block-image img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .block-caption { font-size: 0.9em; color: #64748b; margin-top: 8px; font-style: italic; }
        .block-audio audio { width: 100%; margin-top: 8px; }
        .block-note { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; color: #92400e; }
        .block-callout { padding: 16px; border-radius: 8px; border: 1px solid; margin: 16px 0; display: flex; align-items: start; gap: 12px; }
        .callout-info { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
        .callout-warning { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
        .callout-success { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
        .callout-tip { background: #faf5ff; border-color: #e9d5ff; color: #6b21a8; }
        .block-quote { border-left: 4px solid #cbd5e1; padding-left: 16px; font-style: italic; color: #475569; font-size: 1.1em; margin: 20px 0; }
        .block-divider { height: 1px; background: #e2e8f0; margin: 40px 0; }
        .block-list ul, .block-list ol { margin-left: 20px; }
        .block-list li { margin-bottom: 8px; }
        .block-link a { display: inline-flex; align-items: center; background: #eff6ff; color: #2563eb; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
        
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
          .module { page-break-before: always; }
          .lesson { break-inside: avoid; border: none; }
          .lesson-header { background: none; border-bottom: 2px solid #000; padding-left: 0; }
        }
      </style>
    </head>
    <body>
      <header>
        <h1>${course.title}</h1>
        <div class="course-meta">
          <p><strong>Описание:</strong> ${course.description}</p>
          <p><strong>Дата экспорта:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>
      </header>
  `;

  modules.forEach(mod => {
    html += `
      <section class="module">
        <div class="module-header">
          <h2 class="module-title">Модуль: ${mod.title}</h2>
        </div>
        <div class="module-content">
    `;
    
    const modLessons = lessons.filter(l => l.moduleId === mod.id);
    modLessons.forEach(les => {
      html += `
        <article class="lesson">
          <div class="lesson-header">
            <h3 class="lesson-title">${les.title}</h3>
          </div>
          <div class="lesson-content">
      `;
      
      les.blocks.forEach(block => {
        html += `<div class="block">`;
        switch(block.type) {
          case BlockType.TEXT:
            html += `<div class="block-text">${block.content}</div>`;
            break;
          case BlockType.IMAGE:
            html += `
              <div class="block-image">
                <img src="${block.content}" alt="Image" />
                ${block.metadata?.caption ? `<div class="block-caption">${block.metadata.caption}</div>` : ''}
              </div>`;
            break;
          case BlockType.AUDIO:
            html += `<div class="block-audio"><audio controls src="${block.content}"></audio></div>`;
            break;
          case BlockType.NOTE:
            html += `<div class="block-note"><strong>Заметка:</strong> ${block.content}</div>`;
            break;
          case BlockType.QUOTE:
            html += `<div class="block-quote">${block.content}</div>`;
            break;
          case BlockType.CALLOUT:
            const variant = block.metadata?.variant || 'info';
            html += `<div class="block-callout callout-${variant}">
              <div>${block.content}</div>
            </div>`;
            break;
          case BlockType.DIVIDER:
            html += `<div class="block-divider"></div>`;
            break;
          case BlockType.LIST:
            const listType = block.metadata?.style?.listType === 'number' ? 'ol' : 'ul';
            const items = block.content.split('\n').filter(i => i.trim());
            html += `<div class="block-list"><${listType}>${items.map(i => `<li>${i}</li>`).join('')}</${listType}></div>`;
            break;
          case BlockType.VIDEO_LINK:
          case BlockType.PDF_LINK:
            html += `<div class="block-link"><a href="${block.content}" target="_blank">🔗 Открыть ресурс</a></div>`;
            break;
        }
        html += `</div>`;
      });

      html += `</div></article>`;
    });

    html += `</div></section>`;
  });

  html += `</body></html>`;
  return html;
};

// --- PPTX GENERATOR ---

const generatePPTX = async (data: { course: Course, modules: Module[], lessons: Lesson[] }) => {
  const { course, modules, lessons } = data;
  const pres = new PptxGenJS();

  // Title Slide
  let slide = pres.addSlide();
  slide.addText(course.title, { x: 1, y: 1.5, w: '80%', fontSize: 44, bold: true, color: '363636' });
  slide.addText(course.description || 'Презентация курса', { x: 1, y: 3, w: '80%', fontSize: 24, color: '757575' });

  // Modules
  for (const mod of modules) {
    // Module Section Header
    slide = pres.addSlide();
    slide.background = { color: '1E293B' };
    slide.addText(mod.title, { x: 1, y: '45%', w: '90%', fontSize: 36, color: 'FFFFFF', align: 'center' });

    const modLessons = lessons.filter(l => l.moduleId === mod.id);
    
    for (const les of modLessons) {
      slide = pres.addSlide();
      slide.addText(les.title, { x: 0.5, y: 0.5, w: '90%', fontSize: 24, bold: true, color: '0078D7' });
      
      let yPos = 1.5;
      
      for (const block of les.blocks) {
        if (yPos > 6.5) break;

        if (block.type === BlockType.TEXT || block.type === BlockType.QUOTE || block.type === BlockType.CALLOUT) {
          const text = block.content.length > 200 ? block.content.substring(0, 200) + '...' : block.content;
          slide.addText(text, { x: 0.5, y: yPos, w: '90%', fontSize: 14, color: '363636' });
          yPos += 1.2;
        } else if (block.type === BlockType.LIST) {
           const items = block.content.split('\n').slice(0, 4);
           items.forEach(item => {
             slide.addText(`• ${item}`, { x: 0.8, y: yPos, w: '85%', fontSize: 14, color: '363636' });
             yPos += 0.5;
           });
        } else if (block.type === BlockType.IMAGE) {
          try {
             slide.addImage({ data: block.content, x: 0.5, y: yPos, w: 4, h: 2.5 });
             yPos += 3;
          } catch(e) {
             slide.addText("[Изображение]", { x: 0.5, y: yPos, fontSize: 10 });
             yPos += 0.5;
          }
        }
      }
    }
  }

  return await pres.write("blob");
};

// --- ZIP GENERATOR ---

const generateZIP = async (data: { course: Course, modules: Module[], lessons: Lesson[] }) => {
  const zip = new JSZip();
  const folderName = data.course.title.replace(/[^a-z0-9а-яё]/gi, '_'); // Allow cyrillic in regex or simpler replacement
  const root = zip.folder(folderName);
  
  if (!root) throw new Error("Failed to create zip folder");

  root.file("course_info.json", JSON.stringify(data.course, null, 2));
  const htmlContent = generateFullHTML(data);
  root.file("index.html", htmlContent);

  data.modules.forEach(mod => {
    const modFolder = root.folder(`Module_${mod.order + 1}_${mod.title.replace(/[^a-z0-9а-яё]/gi, '_')}`);
    if (!modFolder) return;

    const modLessons = data.lessons.filter(l => l.moduleId === mod.id);
    modLessons.forEach(les => {
        const lesContent = `
# ${les.title}

${les.blocks.map(b => {
    if(b.type === BlockType.TEXT) return b.content;
    if(b.type === BlockType.LIST) return b.content.split('\n').map(i => `- ${i}`).join('\n');
    if(b.type === BlockType.QUOTE) return `> ${b.content}`;
    if(b.type === BlockType.DIVIDER) return `---`;
    return `[${b.type}]`;
}).join('\n\n')}
        `;
        modFolder.file(`Lesson_${les.order + 1}.md`, lesContent);
    });
  });

  return await zip.generateAsync({ type: "blob" });
};

// --- MAIN EXPORT FUNCTION ---

export const exportCourse = async (courseId: string, format: 'json' | 'html' | 'pptx' | 'pdf' | 'zip', user: User) => {
  const token = localStorage.getItem('eduforge_token');
  if (!token) {
    alert("Вы должны быть авторизованы для экспорта.");
    return;
  }

  try {
    const res = await server.courses.get(token, courseId);
    if (res.error || !res.data) {
      alert('Ошибка при получении данных курса: ' + res.error);
      return;
    }

    const { course, modules, lessons } = res.data;
    const cleanTitle = course.title.replace(/[^a-z0-9а-яё]/gi, '_');

    await server.courses.logExport(token, courseId, format);

    switch (format) {
      case 'html': {
        const html = generateFullHTML({ course, modules, lessons });
        const blob = new Blob([html], { type: 'text/html' });
        downloadBlob(blob, `${cleanTitle}.html`);
        break;
      }

      case 'pdf': {
        const html = generateFullHTML({ course, modules, lessons });
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
          }, 1000);
        }
        break;
      }

      case 'pptx': {
        const pptxBlob = await generatePPTX({ course, modules, lessons });
        downloadBlob(pptxBlob as Blob, `${cleanTitle}.pptx`);
        break;
      }

      case 'zip': {
        const zipBlob = await generateZIP({ course, modules, lessons });
        downloadBlob(zipBlob, `${cleanTitle}.zip`);
        break;
      }
      
      case 'json': {
         const json = JSON.stringify({ course, modules, lessons }, null, 2);
         const blob = new Blob([json], { type: 'application/json' });
         downloadBlob(blob, `${cleanTitle}.json`);
         break;
      }
    }

  } catch (err) {
    console.error(err);
    alert("Произошла ошибка во время экспорта.");
  }
};
