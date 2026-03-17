const fs = require('fs');
const path = require('path');
const base_dir = 'd:\\wrokspace\\takamasu';
const target_dir = path.join(base_dir, 'takamasu');

if (!fs.existsSync(target_dir)) {
    fs.mkdirSync(target_dir);
}

fs.readdirSync(base_dir).forEach(file => {
    if (['takamasu', 'README.md', '.git', 'move_files.js', 'move_files.py'].includes(file)) {
        return;
    }
    
    // Fix mangled file name
    let targetName = file;
    if (file.includes('1怨듯빆') || file.includes('1공항')) {
        targetName = '1공항 atm.jpg';
    }
    
    const src = path.join(base_dir, file);
    const dst = path.join(target_dir, targetName);
    
    try {
        fs.renameSync(src, dst);
        console.log(`Moved ${file} to ${dst}`);
    } catch (e) {
        console.error(`Failed to move ${file}: ${e}`);
    }
});
