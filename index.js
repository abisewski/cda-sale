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

var entregaVipProductsArray = [];

entregaVipProductsArray = [...new Set(entregaVipProductsArray)];

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
  res.setTimeout(4000000);

  console.log('loading');

  getProducts(0)
  // getProducts(22000)

  function getProducts(currentPagination, rangeTotal = 25000, currentData) {
    let newData = currentData || [];

    const perPage = 20;
    const currentPaginationInitial = currentPagination - perPage + 1;

    if (rangeTotal <= currentPaginationInitial || newData.length >= 200) {
      console.log('send data')
      sales.data = newData;
      sales.date = new Date().getTime();
      res.send(newData);
    } else {
      console.log('newData length', newData.length)
      console.log('rangeTotal', rangeTotal)
      console.log('currentPagination', currentPagination)

      var headersAuth = {
        "x-vtex-api-appKey": "vtexappkey-golden-ALXBUJ",
        "x-vtex-api-appToken": "ZUMITPSREYSQVQNTBPMVNRGNRBCQNGZWEZSBRKTILRUHPVNHXJDKVZKJWJCNSBXVIVAVQZSHYQHXQBDPJMJOROZPFUGVMMXTBZSWPKPHFYVLKVRKNWVJHMNRLDKVFIYV",
      };

      // axios.get(`https://www.casadasaliancas.com.br/api/catalog_system/pub/products/search/?fq=C:%3a%2f${categoryId}%2f&_from=${currentPaginationInitial}&_to=${currentPagination}&O=OrderByReleaseDateDESC`, { headers: headersAuth })
      axios.get(`https://www.casadasaliancas.com.br/api/catalog_system/pvt/products/GetProductAndSkuIds?_from=${currentPaginationInitial}&_to=${currentPagination}`, { headers: headersAuth })
        .then(function (salesResponse) {

          let salesResponseData = salesResponse.data.data;
          const totalPages = salesResponse?.data.range.total || 20000
          
          Object.keys(salesResponseData).forEach((productId, index) => {
            let isSale = false;
            let lastIndex = Object.keys(salesResponseData).length === (index + 1);

            console.log("TCL: getProducts -> productId", productId)
            axios.get(`https://www.casadasaliancas.com.br/api/catalog_system/pub/products/search?fq=productId:${productId}`, { headers: headersAuth })
              .then(function (pRes) {
                let saleItem;
                if (pRes.data[0]) {

                  // for (let index = 0; index < pRes.data[0].items.length; index++) {
                  //   if (pRes.data[0].items[index].sellers[0].commertialOffer.AvailableQuantity) {
                      // const price_1 = pRes.data[0].items[index].sellers[0].commertialOffer.Price;
                      // const price_2 = pRes.data[0].items[index].sellers[0].commertialOffer.ListPrice;

                      // if(price_1 !== price_2) {
                      //   isSale = true;
                      // }
                  //   }
                  // }
                  if (pRes.data[0].items[0]) {                    

                    pRes.data[0].items.forEach(item => {
                      if (item.sellers[0].commertialOffer.AvailableQuantity) {
                        // if (item.sellers[0].commertialOffer.DiscountHighLight.length === 1) {
                          const highlight = item.sellers[0].commertialOffer.DiscountHighLight[0];
                          // if (!getKeyByValue(highlight, 'Frete') && !getKeyByValue(highlight, 'Entrega')) {
                            const price_1 = item.sellers[0].commertialOffer.Price;
                            const price_2 = item.sellers[0].commertialOffer.ListPrice;
                            if (price_1 !== price_2) {
                              isSale = true;
                              saleItem = item
                              console.log(highlight)
                            }
                          // }
                        // } 
                        // if (item.sellers[0].commertialOffer.DiscountHighLight.length > 1) {
                        //   isSale = true;
                        //   saleItem = item
                        // }
                      }
                    })

                    // if (pRes.data[0].items[0].sellers[0].commertialOffer.DiscountHighLight.length > 1) {
                    //     isSale = true;
                    // }

                    // pRes.data[0].items[0].sellers[0].commertialOffer.DiscountHighLight.forEach(highlight => {
                    //   if (getKeyByValue(highlight, 'Oferta') || getKeyByValue(highlight, 'OFF')) {
                    //     isSale = true;
                    //   }
                    // })
                  }
                }

                if(isSale) {
                //   console.log('isSale', productId)
                  const resDataArr = [];
                  pRes.data.forEach(item => {
                    const { items } = item
                    // const resData = {
                    //   productId,
                    //   productName, 
                    //   brand,
                    //   items: [items[0]],
                    //   link,
                    //   Filtros
                    // }
                    delete item.description;
                    delete item.items;
                    delete item.itemMetadata;
                    item.items = [saleItem];
                    const installments = item.items[0].sellers[0].commertialOffer.Installments.slice(0,12)
                    delete item.items[0].sellers[0].commertialOffer.Installments;
                    delete item.items[0].sellers[0].commertialOffer.PaymentOptions;
                    item.items[0].sellers[0].commertialOffer.Installments = installments
                    resDataArr.push(item)

                  })
                  newData.push(resDataArr);
                  // newData.push(pRes.data);
                } 
 
                if (lastIndex) {
                  // console.log(newData)
                  // getProducts(currentPagination + perPage, 10000, newData);
                  // setTimeout(() => {
                    getProducts(currentPagination + perPage, totalPages, newData);
                  // }, 2000)
                }
              }).catch(err => {
                getProducts(currentPagination + perPage, salesResponse.data.range.total);
              })

          })
        })
        .catch(error => {
          console.log(error)
          getProducts(currentPagination + perPage, 20000, newData);
        });
    }
  }
});

app.get("/update-category", function (req, res) {
  res.setTimeout(2000000);

  console.log('loading');

  getProducts(0)

  function getProducts(currentPagination, rangeTotal = 20000) {

    const perPage = 20;
    var catId = 448; //Campanhas -> Entrega expressa
    const currentPaginationInitial = currentPagination - perPage + 1;

    console.log('rangeTotal', rangeTotal)
    console.log('currentPagination', currentPagination)

    var headersAuth = {
      "Accept": "application/json", 
      "Content-Type": "application/json",
      "x-vtex-api-appKey": "vtexappkey-golden-ALXBUJ",
      "x-vtex-api-appToken": "ZUMITPSREYSQVQNTBPMVNRGNRBCQNGZWEZSBRKTILRUHPVNHXJDKVZKJWJCNSBXVIVAVQZSHYQHXQBDPJMJOROZPFUGVMMXTBZSWPKPHFYVLKVRKNWVJHMNRLDKVFIYV",
    };

    axios.get(`https://www.casadasaliancas.com.br/api/catalog_system/pvt/products/GetProductAndSkuIds?_from=${currentPaginationInitial}&_to=${currentPagination}`, { headers: headersAuth })
      .then(function (salesResponse) {

        console.log(salesResponse.data.range.total)

        let salesResponseData = salesResponse.data.data;
        
        Object.keys(salesResponseData).forEach((productId, index) => {
        console.log("TCL: getProducts -> productId", productId)
          let lastIndex = Object.keys(salesResponseData).length === (index + 1);
          axios.get(`https://www.casadasaliancas.com.br/api/catalog_system/pub/products/search?fq=productId:${productId}`, { headers: headersAuth })
            .then(function (pRes) {

              if (pRes.data[0]) {
                //Se não estiver na categoria "Entrega Expressa" e tiver a especificação "Entrega Expressa" é adicionado na categoria 448
                if (!pRes.data[0].categories.includes('/Campanhas/Entrega Expressa/') && pRes.data[0]["Entrega Expressa"]) {

                  axios.post(`https://golden.vtexcommercestable.com.br/api/catalog/pvt/product/${productId}/similarcategory/${catId}`, '', { headers: headersAuth })
                    .then(function (pRes) {

                      console.log('adding')
                      console.log(productId);

                      if (lastIndex) {
                        getProducts(currentPagination + perPage, salesResponse.data.range.total);
                      }
                    })
                    .catch(function (err) {
                      console.log(err)
                    })
                } else {
                  if (lastIndex) {
                    getProducts(currentPagination + perPage, salesResponse.data.range.total);
                  }
                  console.log('none')
                }

                //Se estiver na categoria "Entrega Expressa" e não tiver a especificação "Entrega Expressa" é removido da categoria 448
                // if (pRes.data[0].categories.includes('/Campanhas/Entrega Expressa/') && !pRes.data[0]["Entrega Expressa"]) {
                //   axios.delete(`https://golden.vtexcommercestable.com.br/api/catalog/pvt/product/${productId}/similarcategory/${catId}`, '', { headers: headersAuth })
                //     .then(function (pRes) {

                //       console.log('removing')
                //       console.log(productId);

                //       if (lastIndex) {
                //         getProducts(currentPagination + perPage);
                //       }
                //     })
                //     .catch(function (err) {
                //       console.log(err)
                //     })
                // }
              }
            }).catch(err => {
              getProducts(currentPagination + perPage, salesResponse.data.range.total);
            })

        })
      })
      .catch(error => {

        console.log(error)
        getProducts(currentPagination + perPage, salesResponse.data.range.total);
      });
  }
});

app.get("/update-category-from-data", function (req, res) {
  res.setTimeout(2000000);

  console.log('loading');

  var count = 0;

  getProducts(0)

  function getProducts(currentPagination, rangeTotal = 20000) {

    var catId = 448;
    console.log(entregaVipProductsArray.length);
    var headersAuth = {
      "Accept": "application/json", 
      "Content-Type": "application/json",
      "x-vtex-api-appKey": "vtexappkey-golden-ALXBUJ",
      "x-vtex-api-appToken": "ZUMITPSREYSQVQNTBPMVNRGNRBCQNGZWEZSBRKTILRUHPVNHXJDKVZKJWJCNSBXVIVAVQZSHYQHXQBDPJMJOROZPFUGVMMXTBZSWPKPHFYVLKVRKNWVJHMNRLDKVFIYV",
    };

    const entregaVipProductsArrayInterval = setInterval(() => {
      console.log(count)
      console.log(entregaVipProductsArray[count])

      axios.post(`https://golden.vtexcommercestable.com.br/api/catalog/pvt/product/${entregaVipProductsArray[count]}/similarcategory/${catId}`, '', { headers: headersAuth })
        .then(function (pRes) {

          // console.log(productId);
        })
        .catch(function (err) {
          console.log(err)
        })
      if (count >= entregaVipProductsArray.length) {
        clearInterval(entregaVipProductsArrayInterval)
      }
      count++;
    }, 1000)

    // entregaVipProductsArray.forEach((productId, index) => {
    //   axios.post(`https://golden.vtexcommercestable.com.br/api/catalog/pvt/product/${productId}/similarcategory/${catId}`, '',{ headers: headersAuth })
    //     .then(function (pRes) {

    //       console.log(productId);
    //     })
    //     .catch(function (err) {
    //       console.log(err)
    //     })

    // })
  }
});

const server = app.listen(process.env.PORT || 5001, () => {
  const port = server.address().port;
  console.log(`Express is working on port ${port}`);
});