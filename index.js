const express = require('express');
const app = express();

app.get('/', (req, res) => {
  var headers = {
    "x-vtex-api-appKey": "vtexappkey-golden-CEWDHC",
    "x-vtex-api-appToken": "FHGYSNMOHIVBFWZETIEHKCKAVTIXAREZQGQBADRXXQSXGLDZQFYVLOZCXFDZFPOPEVLZGXEQQHJUJMTJPIGVTJOCGNEUZSSICDTLAETTAIEEEFTKMTJWISVUGJSSTJQY"
  };
  
  fetch('/api/catalog_system/pub/products/search?_where=clusterHighlights<210', { headers })
    .then(res => res.json())
    .then(data => res.send(data));
})

const server = app.listen(process.env.PORT || 52353, () => {
  const port = server.address().port;
  console.log(`Express is working on port ${port}`);
});