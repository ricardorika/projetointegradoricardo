const express = require('express');
const app = express();
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require("mongoose");
const ProductsSchema = require('./schemas/Products');
const ClientsSchema = require('./schemas/Clients');
const CategoriesSchema = require('./schemas/Categories');
const md5 = require('md5');


const MONGODB_URL = 'mongodb+srv://ricardorika:220892@cluster0-8giht.mongodb.net/store?retryWrites=true&w=majority';

let env = nunjucks.configure('views', {
    autoescape: true,
    express: app
});

var port = process.env.PORT || 3000;

app.set('engine', env);

require('useful-nunjucks-filters')(env);

const Products = mongoose.model('Product', ProductsSchema);
const Clients = mongoose.model('Clients', ClientsSchema);
const Categories = mongoose.model('Categories', CategoriesSchema);

mongoose.connect(MONGODB_URL, {useNewUrlParser: true}, err => {
    if (err) {
        console.error('[SERVER_ERROR] MongoDB Connection:', err);
        process.exit(1);
    }
    console.info('Mongo connected');


     app.listen(port, () => {
      console.log('Escutando na porta ' + port);
    });
});


app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
extended: true
}));
app.use(express.static('public'));

app.use((req, res, next) => {
  const engine = res.app.get('engine');
  Categories.aggregate([{
    $lookup: {
        from: "products", // collection name in db
        localField: "_id",
        foreignField: "category",
        as: "products"
    }
  }]).sort('name').exec((err, obj) => {
    engine.addGlobal('categories', obj);
    next();
  });
});

app.get('/', (req, res) => {
  Products.find().sort('+price').limit(12).exec((err, obj) => {
    console.info(obj.length);
    res.render('index.html', {products: obj});
  });
});

app.delete('/admin/product/:id', (req, res) => {
  Products.findOneAndRemove({_id: req.params.id}, (err, obj) => {
    if(err) {
      res.send('error');
    }
    res.send('ok');
  });
});

app.delete('/category/:id', (req, res) => {
  Categories.findOneAndRemove({_id: req.params.id}, (err, obj) => {
    if(err) {
      res.send('error');
    }
    res.send('ok');
  });
});

app.use(express.static('public'));

app.get('/products', (req, res) => {
  Products.find((err, obj) => {
     res.render('products.html', {products: obj});
 });
});

app.get('/c/:slug', (req, res) => {
  Categories.aggregate([
    {$match: {slug: req.params.slug}},
    {
    $lookup: {
        from: "products", // collection name in db
        localField: "_id",
        foreignField: "category",
        as: "products"
    }
  }]).exec((err, obj) => {
    console.info(obj);
     res.render('products.html', {products: obj[0].products});
 });
});

app.get('/insertproducts', (req, res) => {
  Products.find((err, products) => {
      Categories.find().sort('name').exec((err, categories) => {
       res.render('insertproducts.html', {products: products, categories: categories});
     });
 });
});

app.get('/contact', (req, res) => {
  res.render('contact.html');
});
app.get('/cart', (req, res) => {
 res.render('cart.html');
});
app.get('/artur', function (req, res) {
 res.render('artur.html');
});
app.post('/send', (req, res) => {
 var email = 'artur.nzk@gmail.com';
 const transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
     user: 'senacerechim2019@gmail.com',
     pass: 'senacrserechim'
   }
 });
 const mailOptions = {
   from: 'senacerechim2019@gmail.com',
   to: email,
   subject: 'Hello ' + req.body.name + ' sending e-mail using Node.js',
   text: req.body.message
 };
 transporter.sendMail(mailOptions, (error, info) => {
   if (error) {
     console.log(error);
   } else {
     console.log('Email sent: ' + info.response);
   }
   res.send('ok');
 });
});

app.get('/cart', (req, res) => {
  res.render('cart.html');
});

app.get('/cart', (req, res) => {
  res.render('nextcart.html');
});

app.get('/register', (req, res) => {
  res.render('register.html');
});

app.get('/product', (req, res) => {
      res.render('product.html');
});

app.get('/categories', (req, res) => {
  Categories.find((err, obj) => {
     res.render('categories.html', {categories: obj});
 });
});

app.get('/artur', function (req, res) {
  res.render('artur.html');
});

app.post('/send', (req, res) => {
  var email = 'artur.nzk@gmail.com';
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'senacerechim2019@gmail.com',
      pass: 'senacrserechim'
    }
  });
  const mailOptions = {
    from: 'senacerechim2019@gmail.com',
    to: email,
    subject: 'Hello ' + req.body.name + ' sending e-mail using Node.js',
    text: req.body.message
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
    res.send('ok');
  });
});

app.post('/client', (req, res) => {
  var client = new Clients(req.body);
  client.password = md5(client.password);
  client.save((err, client) => {
    console.info(client.name + ' salvo');
    res.send('ok');
  })
});

app.post('/insertproducts', (req, res) => {
  var insertproducts = new Products(req.body);
  insertproducts.save((err, insertproducts) => {
    console.info(insertproducts.name + ' salvo');
    res.send('ok');
  })
});

app.post('/categories', (req, res) => {
  var categories = new Categories(req.body);
  categories.save((err, categories) => {
    console.info(categories.name + ' salvo');
    res.send('ok');
  })
});

app.get('/product/:id', (req, res) => {
  Products.find({"_id": req.params.id }, (err, obj) => {
      if (err) {
        res.render('notfound.html');
      } else {
        const product = obj[0];
        res.render('product.html', {product: product});
      }
  });
});


// APIs
app.get('/api/products', (req, res) => {
  res.send(listProducts);
});

app.get('/api/product/:id', (req, res) => {
  Products.find({"_id": req.params.id }, (err, obj) => {
      if (err) {
        res.send(null);
      } else {
        const product = obj[0];
        res.send(product);
      }
  });
});
