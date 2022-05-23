const express = require('express');
const app = express();
const axios = require("axios");

app.engine(".html", require("ejs").__express);

app.set("view engine", "html");

function getKeyByValue(object, value) {
  return Object.keys(object).find(key =>
    object[key].includes(value));
}

let dateTest = [
  [{
    "id": 1,
    "COR DO FUNDO - VISOR": [
        "Preto"
      ],
      "PROFUNDIDADE DE RESISTENCIA À ÁGUA": [
  "10 ATM"
],
  "COR DA PULSEIRA": [
    "Azul"
  ],
    "GARANTIA DO FABRICANTE": [
      "12 Meses"
    ],
    }],
[{
  "id": 2,
  "COR DO FUNDO - VISOR": [
    "Preto"
  ],
  "PROFUNDIDADE DE RESISTENCIA À ÁGUA": [
    "20 ATM"
  ],
  "COR DA PULSEIRA": [
    "Preto"
  ],
  "GARANTIA DO FABRICANTE": "14 Meses",
}],
  [{
    "id": 3,
    "COR DO FUNDO - VISOR": [
      "Azul"
    ],
    "PROFUNDIDADE DE RESISTENCIA À ÁGUA": [
      "20 ATM"
    ],
    "COR DA PULSEIRA": [
      "Branca"
    ],
    "GARANTIA DO FABRICANTE": [
      "14 Meses"
    ],
    "MATERIAL": [
      "Aço Cirúrgico - 304L"
    ]
  }],
];

let date = new Date();
let sales = {
  date: '',
  dateFormated: '',
  data: []
};

app.get("/", function (req, res) {
  res.render("pages/index")
});

app.get("/get-sales", function (req, res) {
  res.setTimeout(2000000);
  let searchedData = [];
  if (Object.keys(req.query).length >= 1) {
    sales.data.forEach(function(salesItem) {
      let added = false;
      Object.keys(req.query).forEach(function(item) {
        if (!salesItem[0][item]) return;

        let matched = salesItem[0][item][0] === req.query[item] || salesItem[0][item] === req.query[item];

        if (matched && !added) {
          searchedData.push(salesItem);
          added = true;
        }
      })
    })
    res.send(searchedData);
  } else {
    res.send(sales.data);
  }
});

app.get('/cron', function(req, res) {
  const currentDate = new Date().getTime();
  let cronInterval = 30 // minutes
  cronInterval = cronInterval * 60 * 1000;
  const cronDate = sales.date + cronInterval;
  const oldDate = sales.date;
  if (currentDate > cronDate) {
    sales.date = currentDate;
    axios.get('https://blog.casadasaliancas.com.br/cda-update-sales.php').then(a => a).catch(err => err);
    res.send({
      message: 'Updating...',
      salesDate: new Date(oldDate),
      currentDate: new Date(currentDate),
    });
  } else {
    res.send({
      message: 'Done',
      salesDate: new Date(oldDate),
      currentDate: new Date(currentDate),
    });
  }

});

app.get("/update-sales", function (req, res) {
  res.setTimeout(2000000);

  console.log('loading');

  getProducts(0)

  function getProducts(currentPagination, rangeTotal = 20000, currentData) {
    let newData = currentData || [];

    const perPage = 20;
    const currentPaginationInitial = currentPagination - perPage + 1;

    if (rangeTotal <= currentPaginationInitial) {
      console.log('send data')
      sales.data = newData;
      sales.date = new Date().getTime();
      res.send(newData);
    } else {
      console.log('rangeTotal', rangeTotal)
      console.log('currentPagination', currentPagination)

      var headersAuth = {
        "x-vtex-api-appKey": "vtexappkey-golden-CEWDHC",
        "x-vtex-api-appToken": "FHGYSNMOHIVBFWZETIEHKCKAVTIXAREZQGQBADRXXQSXGLDZQFYVLOZCXFDZFPOPEVLZGXEQQHJUJMTJPIGVTJOCGNEUZSSICDTLAETTAIEEEFTKMTJWISVUGJSSTJQY"
      };

      // axios.get(`https://www.casadasaliancas.com.br/api/catalog_system/pub/products/search/?fq=C:%3a%2f${categoryId}%2f&_from=${currentPaginationInitial}&_to=${currentPagination}&O=OrderByReleaseDateDESC`, { headers: headersAuth })
      axios.get(`https://www.casadasaliancas.com.br/api/catalog_system/pvt/products/GetProductAndSkuIds?_from=${currentPaginationInitial}&_to=${currentPagination}`, { headers: headersAuth })
        .then(function (salesResponse) {

          let salesResponseData = salesResponse.data.data;
          
          Object.keys(salesResponseData).forEach((productId, index) => {
            let isSale = false;
            let lastIndex = Object.keys(salesResponseData).length === (index + 1);

            axios.get(`https://www.casadasaliancas.com.br/api/catalog_system/pub/products/search?fq=productId:${productId}`, { headers: headersAuth })
              .then(function (pRes) {
                if (pRes.data[0]) {

                  if (pRes.data[0].items[0]) {
                    
                    pRes.data[0].items[0].sellers[0].commertialOffer.DiscountHighLight.forEach(highlight => {
                      if (getKeyByValue(highlight, 'Oferta') || getKeyByValue(highlight, 'OFF')) {
                        isSale = true;
                      }
                    })
                  }
                }

                if(isSale) {
                  console.log('isSale', productId)
                  newData.push(pRes.data);
                }

                if (lastIndex) {
                  getProducts(currentPagination + perPage, salesResponse.data.range.total, newData);
                }
              })

          })
        })
        .catch(error => {

          console.log(error)
          getProducts(currentPagination + perPage, salesResponse.data.range.total, newData);
        });
    }
  }
});

const server = app.listen(process.env.PORT || 5000, () => {
  const port = server.address().port;
  console.log(`Express is working on port ${port}`);
});