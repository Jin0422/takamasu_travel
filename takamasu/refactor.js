const fs = require('fs');

const cssOrder = {
    // 1. Layout
    "display": 1, "grid-template-columns": 2, "flex": 3, "align-items": 4, "justify-content": 5, "gap": 6, "position": 7, "top": 8, "bottom": 9, "left": 10, "right": 11, "float": 12, "clear": 13, "z-index": 14,
    // 2. Box Model
    "width": 15, "height": 16, "margin": 17, "margin-bottom": 18, "margin-top": 19, "padding": 20, "padding-bottom": 21, "padding-left": 22, "border": 23, "border-bottom": 24, "border-left": 25, "border-radius": 26, "box-shadow": 27,
    // 3. Visual
    "background": 28, "background-color": 29, "opacity": 30, "cursor": 31, "transition": 32, "fill": 33, "stroke": 34, "stroke-width": 35, "stroke-linecap": 36, "stroke-linejoin": 37,
    // 4. Typography
    "font-size": 38, "font-weight": 39, "line-height": 40, "font-family": 41, "color": 42, "text-align": 43, "vertical-align": 44, "letter-spacing": 45, "text-transform": 46, "-webkit-font-smoothing": 47, "font-style": 48,
    // 5. Misc
    "content": 49, "list-style": 50, "transform": 51
};

function getOrder(prop) {
    return cssOrder[prop] !== undefined ? cssOrder[prop] : 999;
}

function parseAndSortCss(cssText) {
    const blocks = [];
    const blockRegex = /([^{]+)\s*\{([^}]+)\}/g;
    let match;
    while ((match = blockRegex.exec(cssText)) !== null) {
        blocks.push({
            selector: match[1],
            block: match[2]
        });
    }

    let newCss = "";
    blocks.forEach(b => {
        let selParts = b.selector.split(' ');
        let newSelParts = selParts.map(p => {
            if (p.startsWith('.')) {
                return p.replace(/-/g, '_');
            }
            return p;
        });
        let newSelector = newSelParts.join(' ');
        // exception for md:
        newSelector = newSelector.replace(/md\:grid_cols_2/g, 'md_grid_cols_2');
        newSelector = newSelector.replace(/\\\.md\\:grid_cols_2/g, '.md_grid_cols_2');

        let props = [];
        let lines = b.block.split(';');
        lines.forEach(line => {
            let l = line.trim();
            if (!l) return;
            if (l.includes(':')) {
                let parts = l.split(':');
                props.push([parts[0].trim(), parts.slice(1).join(':').trim()]);
            } else {
                props.push([l, '']);
            }
        });

        props.sort((a, b) => getOrder(a[0]) - getOrder(b[0]));
        let newBlock = props.map(p => `            ${p[0]}: ${p[1]};`).join('\n');
        newCss += `        ${newSelector.trim()} {\n${newBlock}\n        }\n\n`;
    });
    return newCss;
}

const filepath = 'd:\\wrokspace\\takamasu\\index.html';
let htmlContent = fs.readFileSync(filepath, 'utf8');

// Layout wrapping
if (!htmlContent.includes('id="wrap"')) {
    htmlContent = htmlContent.replace('<body>', '<body>\n\n    <div id="wrap">');
    htmlContent = htmlContent.replace('</body>', '    </div>\n    <!-- //wrap -->\n\n</body>');
}
if (!htmlContent.includes('id="container"')) {
    htmlContent = htmlContent.replace('<main>', '<div id="container">\n        <main id="content">');
    htmlContent = htmlContent.replace('</main>', '</main>\n        <!-- //content -->\n    </div>\n    <!-- //container -->');
}
htmlContent = htmlContent.replace(/<header([^>]*)class="header container"/g, '<header id="header" class="header container"');
if (!htmlContent.includes('<!-- //header -->')) {
    htmlContent = htmlContent.replace('</header>', '</header>\n        <!-- //header -->');
}

// Format styles
const styleRegex = /<style>([\s\S]*?)<\/style>/;
const styleMatch = styleRegex.exec(htmlContent);

if (styleMatch) {
    let styles = styleMatch[1];
    let parts = styles.split('/* ==========================================================================');
    let structuredStyles = "";
    for (let part of parts) {
        if (!part.trim()) continue;
        let lines = part.split('\n');
        
        if (part.includes('CSS Variables & Reset')) {
            structuredStyles += '/* ==========================================================================\n' + part;
            continue;
        }

        let newPart = parseAndSortCss(part);
        
        structuredStyles += '/* ==========================================================================\n';
        for (let i = 0; i < 3; i++) {
            if (lines[i] && !lines[i].includes('==') && lines[i].trim()) {
                structuredStyles += `           ${lines[i].trim()}\n`;
            }
        }
        structuredStyles += '           ========================================================================== */\n';
        structuredStyles += newPart;
    }
    
    htmlContent = htmlContent.replace(styleRegex, '<style>\n' + structuredStyles + '    </style>');
}

// Convert HTML classes
htmlContent = htmlContent.replace(/class="([^"]+)"/g, (match, p1) => {
    let newCls = p1.replace(/-/g, '_');
    newCls = newCls.replace(/md:/g, 'md_');
    return `class="${newCls}"`;
});

fs.writeFileSync(filepath, htmlContent, 'utf8');
console.log("done!!");
