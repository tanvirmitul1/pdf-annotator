import fs from 'fs';
import path from 'path';


function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

const pdfjsDist = path.join(process.cwd(), 'node_modules', 'pdfjs-dist');
const publicPath = path.join(process.cwd(), 'public');

const folders = ['standard_fonts', 'cmaps'];

folders.forEach(folder => {
  const src = path.join(pdfjsDist, folder);
  const dest = path.join(publicPath, folder);
  console.log(`Copying ${folder} from ${src} to ${dest}...`);
  copyFolderSync(src, dest);
});

console.log('PDF.js assets copied successfully.');
