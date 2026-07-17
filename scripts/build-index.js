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
        .map((p) => `      <p class="games-note">${escapeHtml(p)}</p>`)
        .join('\n');

      const listHtml = section.items
        .map((item) => {
          if (item.isLink) {
            return `      <div class="post-preview post-preview-home game-item">\n        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">\n          <h3 class="post-title">${escapeHtml(item.text)}</h3>\n          <h4 class="post-subtitle">Open repository on GitHub</h4>\n        </a>\n      </div>\n      <hr class="post-divider game-divider">`;
          }

          return `      <div class="post-preview post-preview-home game-item">\n        <h3 class="post-title">${escapeHtml(item.text)}</h3>\n      </div>\n      <hr class="post-divider game-divider">`;
        })
        .join('\n');

      return `    <section class="games-section">\n      <h2 class="games-section-title">${sectionTitle}</h2>\n${paragraphHtml ? `${paragraphHtml}\n` : ''}${listHtml}\n    </section>`;
    })
    .join('\n\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Games directory" />
  <title>${title}</title>

  <link rel="stylesheet" href="https://sayaka-4987.github.io/css/bootstrap.min.css" />
  <link rel="stylesheet" href="https://sayaka-4987.github.io/css/hux-blog.min.css" />
  <link rel="stylesheet" href="https://sayaka-4987.github.io/css/syntax.css" />
  <link rel="stylesheet" href="https://sayaka-4987.github.io/css/custom.css" />

  <style>
    .intro-header {
      background: no-repeat center center;
      background-size: cover;
      margin-bottom: 20px;
    }

    .intro-header::before {
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.35));
    }

    .intro-header .site-heading {
      padding: 95px 0 70px;
    }

    .intro-header .site-heading h1 {
      font-weight: 700;
    }

    .intro-header .site-heading .subheading {
      display: block;
    }

    .games-main {
      padding-bottom: 60px;
    }

    .games-section {
      margin-bottom: 8px;
    }

    .games-section-title {
      font-size: 28px;
      margin: 32px 0 16px;
      color: #404040;
    }

    .games-note {
      margin: 0 0 14px;
      color: #808080;
    }

    .game-item .post-title {
      font-size: 23px;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    .game-item .post-subtitle {
      font-size: 14px;
      margin: 0 0 6px;
      font-weight: 300;
      opacity: 0.85;
    }

    .game-divider {
      margin-top: 10px;
      margin-bottom: 10px;
    }

    .games-footer {
      margin-top: 10px;
      color: #808080;
      font-size: 15px;
      font-family: 'Lora', 'Times New Roman', serif;
      font-style: italic;
      text-align: center;
    }

    @media only screen and (min-width: 768px) {
      .intro-header .site-heading,
      .intro-header .page-heading {
        padding: 150px 0;
      }

      .games-section-title {
        font-size: 30px;
      }
    }

    @media (max-width: 767px) {
      .intro-header {
        margin-bottom: 12px;
      }

      .games-section-title {
        font-size: 24px;
      }

      .game-item .post-title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <header class="intro-header has-bg-image" style="background-image: url('${heroImageUrl}')">
    <div class="container">
      <div class="row">
        <div class="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1">
          <div class="site-heading with-header-shadow">
            <h1>${title}</h1>
            ${tagline}
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="container games-main">
    <div class="row">
      <div class="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 postlist-container">
${sectionsHtml}

        <footer class="games-footer">
          This page is generated from README.md.
        </footer>
      </div>
    </div>
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
