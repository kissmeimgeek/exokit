#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const find = require('find');
const murmurhash3 = require('murmurhash3');

let dirname = process.argv[2];

let assetStats = [];
const FILE = 1;
const DIRECTORY = 2;

dirname = path.join(dirname, 'android', 'app', 'assets');
console.warn('finding assets...');
Promise.all([
  new Promise((accept, reject) => {
    find.file(dirname, files => {
      accept(files);
    });
  }),
  new Promise((accept, reject) => {
    find.dir(dirname, dirs => {
      accept(dirs);
    });
  }),
]).then(async ([files, dirs]) => {
  console.warn(`found ${files.length} files ${dirs.length} directories`);

  const assets = files.map(asset => ({type: FILE, asset})).concat(dirs.map(asset => ({type: DIRECTORY, asset})));
  for (let i = 0; i < assets.length; i++) {
    let {type, asset} = assets[i];

    const stat = fs.lstatSync(asset);

    asset = asset.slice(dirname.length + 1);
    const parentAsset = path.dirname(asset);

    const [key, parentKey] = await Promise.all([
      new Promise((accept, reject) => {
        murmurhash3.murmur32(asset, (err, hashValue) => {
          if (!err) {
            // console.log('got hash', asset, hashValue.toString(16));
            accept(hashValue);
          } else {
            reject(err);
          }
        });
      }),
      new Promise((accept, reject) => {
        murmurhash3.murmur32(parentAsset, (err, hashValue) => {
          if (!err) {
            // console.log('parent asset hash', JSON.stringify({parentAsset, hashValue}));
            accept(hashValue);
          } else {
            reject(err);
          }
        });
      }),
    ]);

    const name = path.basename(asset);
    const {size} = stat;

    assetStats.push({
      path: asset,
      name,
      key,
      type,
      parentKey,
      size,
      // blksize,
    });
  }
  
  assetStats = assetStats.sort((a, b) => a.path.localeCompare(b.path));

  // console.warn('got assets', JSON.stringify(assetStats, null, 2));

  /* console.log('AssetStat *assetStats;');
  console.log('size_t numAssetStats;');
  console.log('void initAssetStats() {');
  // console.log(`  assetStats = (AssetStat *)malloc(sizeof(AssetStat) * ${assetStats.length});`);
  // console.log(`  printf("initialize asset stats %d", numAssetStats); fflush(stdout);`);
  // console.log(`  assetStats = (const AssetStat *)"`); */
  for (let i = 0; i < assetStats.length; i++) {
    const assetStat = assetStats[i];

    const buffer = new Uint8Array(256+4+4+8+8);
    buffer.set(new TextEncoder().encode(assetStat.name.padEnd(256, '\0')));
    const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    dataView.setUint32(256, assetStat.key, true);
    dataView.setUint32(256+4, assetStat.parentKey, true);
    dataView.setUint32(256+4+4, assetStat.type, true); // actually setUint64
    dataView.setUint32(256+4+4+8, assetStat.size, true); // actually setUint64

    const b = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    // console.log('write', b.length, b.toString('utf8'));
    // console.log('write 1', b.length);
    // console.log('write 2', b.toString('utf8'));
    // process.stdout.write(b);
    process.stdout.write(b);
    process.stderr.write(JSON.stringify(assetStat,null,2) + '\n');

    /* console.log(`  { // ${assetStat.path}`);
    console.log(`    AssetStat *as = &assetStats[${i}];`);
    console.log(`    as->name = "${assetStat.name}";`);
    console.log(`    as->key = 0x${assetStat.key.toString(16)};`);
    console.log(`    as->parentKey = 0x${assetStat.parentKey.toString(16)};`);
    console.log(`    as->size = ${assetStat.size};`);
    console.log(`  }`);
    // console.log(`  AssetStat("${assetStat.name}", 0x${assetStat.key.toString(16)}, 0x${assetStat.parentKey.toString(16)}, ${assetStat.size}), // ${assetStat.path}`); */
  }
  /* console.log(`  numAssetStats = ${assetStats.length};`);
  console.log('};\n'); */
});
