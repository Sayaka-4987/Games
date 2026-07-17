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
  const title = escapeHtml(model.pageTitle || 'Games - Blog by WYX');
  const tagline = model.tagline ? `<span class="subheading">${escapeHtml(model.tagline)}</span>` : '';
  const heroImageUrl = 'https://sayaka-4987.github.io/img/post-bg-desk.jpg';
  const blogHomeUrl = 'https://sayaka-4987.github.io/';
  const aboutUrl = 'https://sayaka-4987.github.io/about/';
  const tagsUrl = 'https://sayaka-4987.github.io/tags/';
  const gamesHomeUrl = 'https://sayaka-4987.github.io/Games/';

  const sectionsHtml = model.sections
    .map((section) => {
      const sectionTitle = escapeHtml(section.title || 'Section');
      const paragraphHtml = section.paragraphs
        .map((p) => `      <p class="games-note">${escapeHtml(p)}</p>`)
        .join('\n');

      const listItemsHtml = section.items
        .map((item) => {
          if (item.isLink) {
            return `        <li><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.text)}</a></li>`;
          }

          return `        <li>${escapeHtml(item.text)}</li>`;
        })
        .join('\n');

      const listHtml = section.items.length
        ? `      <ul class="games-list">\n${listItemsHtml}\n      </ul>`
        : '';

      return `    <section class="games-section">\n      <h2 class="games-section-title">${sectionTitle}</h2>\n${paragraphHtml ? `${paragraphHtml}\n` : ''}${listHtml}\n      <hr class="post-divider game-divider">\n    </section>`;
    })
    .join('\n\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Games directory" />
  <title>${title}</title>

  <link rel="shortcut icon" href="https://sayaka-4987.github.io/img/favicon.ico" />
  <link rel="apple-touch-icon" href="https://sayaka-4987.github.io/img/apple-touch-icon.png" />

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

    .games-list {
      margin: 0;
      padding-left: 22px;
    }

    .games-list li {
      margin: 0 0 10px;
      color: #404040;
      line-height: 1.6;
      font-size: 18px;
    }

    .games-list li:last-child {
      margin-bottom: 0;
    }

    .games-list a {
      color: #5b4abf;
      text-decoration: none;
      border-bottom: 1px solid rgba(91, 74, 191, 0.35);
    }

    .games-list a:visited {
      color: #6f4a9e;
      border-bottom-color: rgba(111, 74, 158, 0.35);
    }

    .games-list a:hover,
    .games-list a:focus {
      color: #663399;
      border-bottom-color: #663399;
      text-decoration: none;
    }

    .game-divider {
      margin-top: 18px;
      margin-bottom: 18px;
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

      .games-list li {
        font-size: 17px;
      }
    }
  </style>
</head>
<body>
  <nav class="navbar navbar-default navbar-custom navbar-fixed-top">
    <div class="container-fluid">
      <div class="navbar-header page-scroll">
        <button type="button" class="navbar-toggle" aria-label="Toggle navigation menu" aria-controls="huxblog_navbar" aria-expanded="false">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <a class="navbar-brand" href="${blogHomeUrl}">Blog by WYX</a>
      </div>

      <div id="huxblog_navbar">
        <div class="navbar-collapse">
          <ul class="nav navbar-nav navbar-right">
            <li><a href="${blogHomeUrl}">Home</a></li>
            <li><a href="${aboutUrl}">About</a></li>
            <li><a href="${tagsUrl}">Tags</a></li>
            <li><a href="${gamesHomeUrl}">Games</a></li>
          </ul>
        </div>
      </div>
    </div>
  </nav>

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

  <script>
    var $toggle = document.querySelector('.navbar-toggle');
    var $navbar = document.querySelector('#huxblog_navbar');
    var $collapse = document.querySelector('.navbar-collapse');

    if ($toggle && $navbar && $collapse) {
      var __HuxNav__ = {
        close: function() {
          $navbar.className = ' ';
          $toggle.setAttribute('aria-expanded', 'false');
          setTimeout(function() {
            if ($navbar.className.indexOf('in') < 0) {
              $collapse.style.height = '0px';
            }
          }, 400);
        },
        open: function() {
          $collapse.style.height = 'auto';
          $navbar.className += ' in';
          $toggle.setAttribute('aria-expanded', 'true');
        }
      };

      $toggle.addEventListener('click', function() {
        if ($navbar.className.indexOf('in') > 0) {
          __HuxNav__.close();
        } else {
          __HuxNav__.open();
        }
      });

      $toggle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if ($navbar.className.indexOf('in') > 0) {
            __HuxNav__.close();
          } else {
            __HuxNav__.open();
          }
        }
      });

      document.addEventListener('click', function(e) {
        if (e.target === $toggle) return;
        if (e.target.className === 'icon-bar') return;
        __HuxNav__.close();
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && $navbar.className.indexOf('in') > 0) {
          __HuxNav__.close();
          $toggle.focus();
        }
      });
    }
  </script>
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
