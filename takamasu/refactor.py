import re
import os

css_order = {
    # 1. Layout
    "display": 1, "grid-template-columns": 2, "flex": 3, "align-items": 4, "justify-content": 5, "gap": 6, "position": 7, "top": 8, "bottom": 9, "left": 10, "right": 11, "float": 12, "clear": 13, "z-index": 14,
    # 2. Box Model
    "width": 15, "height": 16, "margin": 17, "margin-bottom": 18, "margin-top": 19, "padding": 20, "padding-bottom": 21, "padding-left": 22, "border": 23, "border-bottom": 24, "border-left": 25, "border-radius": 26, "box-shadow": 27,
    # 3. Visual
    "background": 28, "background-color": 29, "opacity": 30, "cursor": 31, "transition": 32, "fill": 33, "stroke": 34, "stroke-width": 35, "stroke-linecap": 36, "stroke-linejoin": 37,
    # 4. Typography
    "font-size": 38, "font-weight": 39, "line-height": 40, "font-family": 41, "color": 42, "text-align": 43, "vertical-align": 44, "letter-spacing": 45, "text-transform": 46, "-webkit-font-smoothing": 47, "font-style": 48,
    # 5. Misc
    "content": 49, "list-style": 50, "transform": 51
}

def get_order(prop):
    return css_order.get(prop, 999)

def parse_and_sort_css(css_text):
    # Split by blocks
    blocks = re.findall(r'([^}{]+)\s*\{([^}]+)\}', css_text)
    new_css = ""
    for selector, block in blocks:
        sel_parts = selector.split()
        new_sel_parts = []
        for p in sel_parts:
            # Classes
            if p.startswith('.'):
                new_sel_parts.append(p.replace('-', '_'))
            else:
                new_sel_parts.append(p)
        new_selector = " ".join(new_sel_parts)
        # Exception for responsive tailwind-like pseudo class
        new_selector = new_selector.replace('md:grid_cols_2', 'md_grid_cols_2')
        new_selector = ' '.join([seg.replace('\\.md\\:grid_cols_2', '.md_grid_cols_2') for seg in new_selector.split(' ')])

        props = []
        for line in block.split(';'):
            line = line.strip()
            if not line: continue
            if ':' in line:
                key, val = line.split(':', 1)
                props.append((key.strip(), val.strip()))
            else:
                props.append((line, ''))
        
        props.sort(key=lambda x: get_order(x[0]))
        new_block = "\n".join([f"            {k}: {v};" for k, v in props])
        new_css += f"        {new_selector.strip()} {{\n{new_block}\n        }}\n\n"
    return new_css

filepath = r'd:\wrokspace\takamasu\index.html'

with open(filepath, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Layout
if 'id="wrap"' not in html_content:
    html_content = html_content.replace('<body>', '<body>\n\n    <div id="wrap">')
    html_content = html_content.replace('</body>', '    </div>\n    <!-- //wrap -->\n\n</body>')

if 'id="container"' not in html_content:
    html_content = html_content.replace('<main>', '<div id="container">\n        <main id="content">')
    html_content = html_content.replace('</main>', '</main>\n        <!-- //content -->\n    </div>\n    <!-- //container -->')

html_content = re.sub(r'<header([^>]*)class="header container"', r'<header id="header" class="header container"', html_content)
if '<!-- //header -->' not in html_content:
    html_content = html_content.replace('</header>', '</header>\n        <!-- //header -->')

style_match = re.search(r'<style>(.*?)</style>', html_content, re.DOTALL)
if style_match:
    styles = style_match.group(1)
    parts = styles.split('/* ==========================================================================')
    structured_styles = ""
    for part in parts:
        if not part.strip(): continue
        lines = part.splitlines()
        
        if 'CSS Variables & Reset' in part:
            structured_styles += '/* ==========================================================================\n' + part
            continue
            
        new_part = parse_and_sort_css(part)
        
        # Include the comment header
        structured_styles += '/* ==========================================================================\n'
        for line in lines[:3]:
            if '==' not in line and line.strip():
                structured_styles += f"           {line.strip()}\n"
        structured_styles += '           ========================================================================== */\n'
        structured_styles += new_part

    html_content = html_content[:style_match.start(1)] + '\n' + structured_styles + '    ' + html_content[style_match.end(1):]

def class_replacer(match):
    cls_attr = match.group(1)
    new_cls = cls_attr.replace('-', '_')
    new_cls = new_cls.replace('md:', 'md_')
    return f'class="{new_cls}"'

html_content = re.sub(r'class="([^"]+)"', class_replacer, html_content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("done!!")
