const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const readmePath = path.join(repoRoot, 'README.md');
const outputPath = path.join(repoRoot, 'index.html');

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseMarkdown(readmeText) {
  const lines = readmeText.split(/\r?\n/);

  let pageTitle = 'Games';
  let tagline = '';
  const sections = [];
  let currentSection = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (line.startsWith('# ')) {
      pageTitle = line.slice(2).trim() || pageTitle;
      continue;
    }

    if (line.startsWith('## ')) {
      currentSection = {
        title: line.slice(3).trim(),
        items: [],
        paragraphs: []
      };
      sections.push(currentSection);
      continue;
    }

    const linkMatch = line.match(/^-\s+\[(.+?)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      const [, text, url] = linkMatch;
      if (!currentSection) {
        currentSection = {
          title: 'Other',
          items: [],
          paragraphs: []
        };
        sections.push(currentSection);
      }
      currentSection.items.push({
        text: text.trim(),
        url: url.trim(),
        isLink: true
      });
      continue;
    }

    const plainBulletMatch = line.match(/^-\s+(.+)$/);
    if (plainBulletMatch) {
      if (!currentSection) {
        currentSection = {
          title: 'Other',
          items: [],
          paragraphs: []
        };
        sections.push(currentSection);
      }
      currentSection.items.push({ text: plainBulletMatch[1].trim(), isLink: false });
      continue;
    }

    if (!tagline) {
      tagline = line;
      continue;
    }

    if (!currentSection) {
      currentSection = {
        title: 'Notes',
        items: [],
        paragraphs: []
      };
      sections.push(currentSection);
    }

    currentSection.paragraphs.push(line);
  }

  return {
    pageTitle,
    tagline,
    sections
  };
}

function renderHtml(model) {
  const title = escapeHtml(model.pageTitle || 'Games');
  const tagline = model.tagline ? `<span class="subheading">${escapeHtml(model.tagline)}</span>` : '';
  const heroImageUrl = 'https://sayaka-4987.github.io/img/post-bg-desk.jpg';

  const sectionsHtml = model.sections
    .map((section) => {
      const sectionTitle = escapeHtml(section.title || 'Section');
      const paragraphHtml = section.paragraphs
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join('\n        ');

      const listHtml = section.items.length
        ? `<ul class="game-list">\n${section.items
            .map((item) => {
              if (item.isLink) {
                return `          <li><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.text)}</a></li>`;
              }
              return `          <li>${escapeHtml(item.text)}</li>`;
            })
            .join('\n')}\n        </ul>`
        : '';

      return `      <section class="catalog-card">\n        <h2 class="section-title">${sectionTitle}</h2>\n        ${paragraphHtml}\n        ${listHtml}\n      </section>`;
    })
    .join('\n\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Games directory" />
  <title>${title}</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Arial", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: #404040;
      background: #ffffff;
      line-height: 1.7;
    }

    .container,
    .catalog-container {
      width: min(960px, 92vw);
      margin: 0 auto;
    }

    .intro-header {
      margin-bottom: 20px;
      background: no-repeat center center;
      background-color: #808080;
      background-size: cover;
      position: relative;
    }

    .intro-header::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.4));
    }

    .intro-header .site-heading {
      position: relative;
      z-index: 1;
      text-align: center;
      color: #ffffff;
      padding: 95px 0 70px;
    }

    .intro-header .site-heading h1 {
      margin: 0;
      font-size: 50px;
      line-height: 1.1;
      font-weight: 800;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.28);
    }

    .intro-header .site-heading .subheading {
      display: block;
      margin-top: 10px;
      font-size: 18px;
      font-weight: 300;
      line-height: 1.1;
      text-shadow: 0 1px 8px rgba(0, 0, 0, 0.28);
    }

    .catalog-container {
      padding: 8px 0 64px;
    }

    .catalog-card {
      border: 1px solid #eee;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 8px 20px rgba(64, 64, 64, 0.06);
      padding: 22px 24px;
      margin-bottom: 22px;
      transition: box-shadow 0.18s ease;
    }

    .catalog-card:hover {
      box-shadow: 0 12px 28px rgba(64, 64, 64, 0.1);
    }

    .section-title {
      margin: 0 0 14px;
      font-size: 28px;
      line-height: 1.3;
      font-weight: 700;
      color: #404040;
    }

    p {
      margin: 0 0 12px;
      color: #666;
      font-size: 16px;
    }

    .game-list {
      margin: 0;
      padding-left: 1.2rem;
    }

    .game-list li {
      margin: 0;
      padding: 0;
      font-size: 18px;
      line-height: 1.6;
      color: #404040;
    }

    .game-list li + li {
      margin-top: 0.55rem;
    }

    .game-list a {
      color: #404040;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: color 0.2s ease, border-color 0.2s ease;
    }

    .game-list a:hover,
    .game-list a:focus {
      color: #663399;
      border-bottom-color: #663399;
    }

    .catalog-footer {
      margin-top: 10px;
      color: #808080;
      font-size: 15px;
      font-family: 'Lora', 'Times New Roman', serif;
      font-style: italic;
      text-align: center;
    }

    @media only screen and (min-width: 768px) {
      .intro-header .site-heading {
        padding: 150px 0;
      }

      .intro-header .site-heading h1 {
        font-size: 80px;
      }

      .catalog-card {
        padding: 26px 30px;
      }

      .section-title {
        font-size: 30px;
      }
    }

    @media (max-width: 767px) {
      .intro-header {
        margin-bottom: 12px;
      }

      .intro-header .site-heading h1 {
        font-size: 44px;
      }

      .intro-header .site-heading .subheading {
        font-size: 17px;
      }

      .catalog-container {
        padding-top: 6px;
      }

      .catalog-card {
        margin-bottom: 16px;
        padding: 18px 18px;
      }

      .section-title {
        font-size: 24px;
      }

      .game-list li {
        font-size: 17px;
      }
    }
  </style>
</head>
<body>
  <header class="intro-header" style="background-image: url('${heroImageUrl}')">
    <div class="container">
      <div class="site-heading">
        <h1>${title}</h1>
        ${tagline}
      </div>
    </div>
  </header>

  <main class="catalog-container">
${sectionsHtml}

    <footer class="catalog-footer">
      This page is generated from README.md.
    </footer>
  </main>
</body>
</html>
`;
}

function main() {
  if (!fs.existsSync(readmePath)) {
    throw new Error(`README.md not found at: ${readmePath}`);
  }

  const readmeText = fs.readFileSync(readmePath, 'utf8');
  const model = parseMarkdown(readmeText);
  const html = renderHtml(model);

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`Generated ${outputPath}`);
}

main();
