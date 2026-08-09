# @bivelicons/webfonts

A modern, open-source icon library delivered as webfonts.  
Multiple styles, auto-generated CSS, and a consistent class-based API – optimized for performance and developer experience.

---

## ✨ Icon Styles

| Style         | Prefix  | Description                       |
| ------------- | ------- | --------------------------------- |
| Solid Rounded | `bi-sr` | Filled icons with rounded corners |
| Brands        | `bi-br` | Official logos and brand marks    |

---

## 📦 Installation

```bash
# npm
npm install @bivelicons/webfonts

# pnpm
pnpm add @bivelicons/webfonts

# yarn
yarn add @bivelicons/webfonts
```

---

## 🌐 CDN Usage

```html
Load all styles or a specific one directly from a CDN:

<!-- All styles combined -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@bivelicons/webfonts/css/bivelicons.css"
/>

<!-- Solid Rounded only -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@bivelicons/webfonts/css/bivelicons-solid-rounded.css"
/>

<!-- Brands only -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@bivelicons/webfonts/css/bivelicons-brands.css"
/>
```

---

## 🚀 Usage

Add the base class bc and the icon class to any HTML element:

```html
<i class="bc bi-sr-home"></i>
<span class="bc bi-sr-user"></span>
<i class="bc bi-br-github"></i>
```

Class naming convention:

```text
bc  bi-{prefix}-{name}
│   │    │         └── icon name (kebab-case)
│   │    └── style prefix (sr, br)
│   └── icon namespace
└── base class (required)
```

---

## API Reference

| Component       | Description                                                         |
| --------------- | ------------------------------------------------------------------- |
| Base class `bc` | Required on every icon element – sets font, antialiasing, etc.      |
| Style prefix    | Identifies the icon style (`sr` for Solid Rounded, `br` for Brands) |
| Icon name       | Lowercase kebab-case, derived from the original SVG file name       |

Examples:

```html
<i class="bc bi-sr-arrow-right"></i>

<span class="bc bi-br-github"></span>
```

---

##⚡ Performance

- SVGs are optimized with SVGO before being compiled into webfonts.

- Only WOFF2 and WOFF formats are distributed.

- CSS files are minimal; the combined bivelicons.css includes all styles, while individual stylesheets allow selective loading.

---

## 🤝 Contributing

We welcome contributions! Please see the main repository for guidelines on adding new icons, styles, or improvements.

---

## 📄 License

MIT © Bivelcode – see LICENSE for details.
