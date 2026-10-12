const fs = require('fs');

const template = fs.readFileSync('index.html', 'utf8');

function generateHtml(options) {
  let content = template;
  content = content.replace(/<title>[\s\S]*?<\/title>/, `<title>${options.title}</title>`);
  content = content.replace(/<link rel="canonical" href="[\s\S]*?" \/>/, `<link rel="canonical" href="${options.url}" />`);
  content = content.replace(/<meta property="og:title" content="[\s\S]*?" \/>/, `<meta property="og:title" content="${options.title}" />`);
  content = content.replace(/<meta property="og:description" content="[\s\S]*?" \/>/, `<meta property="og:description" content="${options.description}" />`);
  content = content.replace(/<meta property="og:url" content="[\s\S]*?" \/>/, `<meta property="og:url" content="${options.url}" />`);
  content = content.replace(/<meta property="og:image" content="[\s\S]*?" \/>/, `<meta property="og:image" content="${options.image}" />`);
  content = content.replace(/<meta property="og:image:secure_url" content="[\s\S]*?" \/>/, `<meta property="og:image:secure_url" content="${options.image}" />`);
  content = content.replace(/<meta property="og:image:alt" content="[\s\S]*?" \/>/, `<meta property="og:image:alt" content="${options.title}" />`);
  content = content.replace(/<meta name="twitter:title" content="[\s\S]*?" \/>/, `<meta name="twitter:title" content="${options.title}" />`);
  content = content.replace(/<meta property="twitter:title" content="[\s\S]*?" \/>/, `<meta property="twitter:title" content="${options.title}" />`);
  content = content.replace(/<meta name="twitter:description" content="[\s\S]*?" \/>/, `<meta name="twitter:description" content="${options.description}" />`);
  content = content.replace(/<meta property="twitter:description" content="[\s\S]*?" \/>/, `<meta property="twitter:description" content="${options.description}" />`);
  content = content.replace(/<meta name="twitter:image" content="[\s\S]*?" \/>/, `<meta name="twitter:image" content="${options.image}" />`);
  content = content.replace(/<meta property="twitter:image" content="[\s\S]*?" \/>/, `<meta property="twitter:image" content="${options.image}" />`);
  content = content.replace(/<meta name="twitter:url" content="[\s\S]*?" \/>/, `<meta name="twitter:url" content="${options.url}" />`);
  content = content.replace(/<meta property="twitter:url" content="[\s\S]*?" \/>/, `<meta property="twitter:url" content="${options.url}" />`);
  return content;
}

const pages = [
  {
    dir: 'public/admissionform',
    title: 'Student Admission Form | The Fretboard Society',
    description: 'Official digital admission form for new students enrolling into acoustic guitar or ukulele programs at The Fretboard Society.',
    url: 'https://thefretboardsociety.netlify.app/admissionform',
    image: 'https://thefretboardsociety.netlify.app/images/admission-share.png'
  },
  {
    dir: 'public/feepayment',
    title: 'Monthly Fee Payment | The Fretboard Society',
    description: 'Secure student portal for monthly tuition fee payments with instant UPI verification and digital receipt generation.',
    url: 'https://thefretboardsociety.netlify.app/feepayment',
    image: 'https://thefretboardsociety.netlify.app/images/fee-share.png'
  }
];

for (const p of pages) {
  if (!fs.existsSync(p.dir)) fs.mkdirSync(p.dir, { recursive: true });
  fs.writeFileSync(`${p.dir}/index.html`, generateHtml(p));
  console.log(`Generated pre-rendered meta in ${p.dir}/index.html`);
}
