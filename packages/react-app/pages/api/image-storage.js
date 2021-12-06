// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import multiparty from "multiparty";
import { Web3Storage, File } from "web3.storage";
import * as fs from "fs";

function parseForm(req) {
  const form = new multiparty.Form();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          fields: fields,
          files: files,
        });
      }
    });
  });
}

function getWeb3Token() {
  const token = process.env.WEB3STORAGE_TOKEN;
  if (!token) throw new Error(`Misconfigured: web3.storage token`);
  return token;
}

const web3Storage = new Web3Storage({ token: getWeb3Token() });

async function handler(req, res) {
  const form = await parseForm(req);
  // console.log(form);
  const cids = await Promise.all(
    Object.values(form.files)
      .flatMap(file => file)
      .map(async file => {
        const name = file.originalFilename;
        const f = new File([fs.readFileSync(file.path)], name, { type: "image/*" });
        const cid = await web3Storage.put([f], { wrapWithDirectory: false });
        return { field: file.fieldName, cid };
      }),
  );
  console.log({ cids });
  // const file = form.files[0];
  // const name = file.originalFilename;
  return res.status(200).json({
    cids: cids.reduce((formattedCids, curr) => {
      formattedCids[curr.field] = curr.cid;
      return formattedCids;
    }, {}),
  });
}

// first we need to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};
export default handler;
