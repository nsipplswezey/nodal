---
id: tutorial
title: Tutorial
prev: getting-started.html
next: thinking-in-react.html
---

We'll be building a simple API server for a twitter clone called insta-tweet. It'll be a basic version of the APIs that allow users to create accounts, login and create content associated with their accounts like Twitter, Reddit or HackerNews.

We'll provide:

* API end points for users and tweets
* User authentication using OAuth and session tokens
* Database migrations using PostgreSQL

It'll also have a few neat features:

* **Input Validation**: API requests will be validated before responses are generated.
* **Namespaced API**: our API will be namespaced as v1 of our instatweet-api
* **Instant Deployment**: we'll have our API live by the end of the tutorial.

Want to skip all this and just see the source?

[It's all on GitHub](https://github.com/keithwhor/nodal/tree/master/examples/instatweet-api).

## Install
We'll start with a fresh global install of Nodal to make Nodal generators available at the command line. If you want to see alternatives to global installation of node packages, and the rationale for that approach, you can read more here. Make sure you have Nodal version 0.9.0 or greater.
sudo npm install nodal -g

Create a new project

```
$ nodal new instatweet-api
```

After Nodal is done generating our server we can start it up!

```
$ cd instatweet-api && run nodal s
```
Our server should now be available at localhost:3000
Let's double check:
￼

## Deployment

Now that we checked that our Nodal server is working, let's deploy it.

```
$ nodal poly:register
```

You'll be prompted to enter a valid email and password.

```
$ nodal poly:create instatweet
```

The name 'instatweet' may already be taken. If that's the case add unique identifier to your project name. This project name will be the base of the host name for your deployed API path.

You should receive a response similar to the following:

```
$ nodal poly:create instatweet
```

```
Creating project "instatweet"...
Project created successfully!
{ id: 3,
  name: 'instatweet',
  description: null,
  service_type: 'api',
  user_id: 3,
  env: 'NODE_ENV=production',
  created_at: '2016-04-16T02:47:22.263Z',
  updated_at: '2016-04-16T02:47:22.264Z',
  url: 'https://instatweet.api.poly.cloud' }
```

Then from within your Nodal API directory, run:

```
$ nodal poly:deploy instatweet
```

This will upload and deploy the Nodal server in whatever directory you're currently in, using the project name you provide in the command line –not your Nodal project name. Our Nodal project is named instatweet-api, but our hosted project name will just be instatweet.

Now visit https://instatweet.api.poly.cloud/ and you should receive the same response that we received at `localhost:3000/`

```
{
  "meta": {
    "total": 1,
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "message": "Welcome to your Nodal Project"
    }
  ]
}
```

We're deployed! From here on out, this tutorial will guide you through developing your API locally, before deploying it again. Whenever you're ready to deploy your local API, you can just run nodal poly:deploy instaweet and you're changes should be live!

## Our application Structure

Back to your Nodal project. Let's go one step at a time to avoid getting distracted by everything Nodal has generated for us.

### Our First Controller: An Example of Nodal Generator Output

Nodal generators are all about implementing idiomatic syntax and powerful design patterns that are consistent, clear, scalable and extensible.

You'll notice that all Nodal modules follow a similar pattern:

* immediately-invoked-function-expression(IIFE) to wrap modules. This may change in the future, but you won't need to worry about it because Nodal generators will handle it for you. 
* import dependencies explicitly. 
* emulate classical inheritance by extending a base Nodal class. 
* implement methods relevant to the concerns of the module. 

We'll start by looking at a Nodal controller, which extends Nodal.Controller and implements methods for handling requests to our API.

```javascript
//app/controllers/index_controller.js
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class IndexController extends Nodal.Controller {

    get() {

      this.respond({message: 'Welcome to your Nodal Project'});

    }

  }

  return IndexController;

})();
```

The IndexController extends from the `Nodal.Controller` class, then defines the `get()` method for the IndexController instance of the `Nodal.Controller` class. Inside the `get()` method, we invoke the controller's `respond()` method to handle a GET request to our API's index path. This pattern of extending Nodal classes, implementing the methods of their instances, and utilizing Nodal methods in those implementations is consistent across all of Nodal. This pattern is similar to that of frameworks like Rails and Django. ES6 class syntax makes this pattern feel natural in Nodal.

Clear and consistent design patterns are intended to make Nodal easy to get started with, powerful enough to address many API needs out of the box and consistent enough to keep your server application logic easy to follow as you extend your server beyond what Nodal generators provide.

Our IndexController handles any GET requests to `localhost:3000/` by sending whatever response is passed to `this.respond()`.

## A Tweet Model:

Now that we've had a look at some Nodal code, let's keep on building our API. The first thing our instatweet-api needs is a way to store tweets. Nodal uses a models layer to marshall data as it moves between our API endpoint and our database. We'll use a Nodal generator to generate a model that describes the tweets our API will handle. Each tweet has a user id and a body which is a string.

Let's open up a new terminal window, since our first window is now running our server, andcd instatweet-api. From within our instatweet-api folder, we can use the following Nodal command to generate our Tweet model.

```
$ nodal g:model Tweet user_id:int body:string
```

In Nodal, we define the schema of our model in our generator command. In this case, a tweet has two fields: a user_id which is an integer, and a body which is a string. Nodal does the work to create a consistent interface between our model, our schema and our actual data table in our Postgres database.

You'll see that the Nodal generator logs the files it generates in your console.

```
Create: ./app/models/tweet.js
Create: ./db/migrations/2016040820210712__create_tweet.js
```
Using Nodal, we've generated a tweet.js file in our models directory, and we've generated something called a migration.

## Our First Migration:

Nodal uses a specific design pattern for managing our database as we develop our application. This pattern is built on an abstraction called a migration.
Migrations offer a consistent and convenient way to alter your database schema over time. You can think of each migration as being a new version of the database. This is an idea borrowed from Rails, and you can read an in-depth article on migrations here: here

For our purposes, what we need to know is that our Nodal generated a file, with a timestamp, in our server's db/migrations directory.

```
./db/migrations/2016040820210712__create_tweet.js
```

If we look at this file, we'll see that it follows the same pattern as the index controller we looked at first: uses an IIFE to wrap the module, imports dependencies explicitly, emulates classical inheritance by extending a Nodal class, and implements methods relevant to the concerns of the module. In this case we're extending the Nodal.Migrations class. The constructor method is an implementation detail. The two methods to focus on here are the `up()` and `down()` methods.

```javascript{15-21,23-29}
// ./db/migrations/UTCTimestamp__create_tweet.js
module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class CreateTweet extends Nodal.Migration {

    constructor(db) {
      super(db);
      this.id = 2016041420441120;
    }

    up() {

      return [
        this.createTable("tweets", [{"name":"user_id","type":"int"},{"name":"body","type":"string"}])
      ];

    }

    down() {

      return [
        this.dropTable("tweets")
      ];

    }

  }

  return CreateTweet;

})();
```

`up()` will create a new tweets table using the schema we defined in the command line. `down()` will drop that table.

In this way we can roll our database forward, or backward if needed, as we develop our API.

Each time we use the generator to create a new model, we'll create a new migrations file that contains up and down migrations representing the new tables needed to match our models, and an operation that will drop those new tables and return us to a previous version of our database.

## Our First Model

Our command line generator created `./app/models/tweet.js` for us as well. Our model follows the same ES6 classical inheritance emulation pattern, extending our Tweet model from `Nodal.Model`. Our Tweet model sets our database using a generated config from our db directory. Then it sets the schema for our Tweet using an internal description of our tweet model schema.

```javascript{9,11-12}
//app/models/tweet.js

module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class Tweet extends Nodal.Model {}

  Tweet.setDatabase(Nodal.require('db/main.js'));
  Tweet.setSchema(Nodal.my.Schema.models.Tweet);

  return Tweet;

})();
```

## Back to Migrations: Let's get our model up and running

Nodal provides a command line interface for executing the database operations that our server needs to set up our API database. We create our PostgreSQL database using the follow nodal command:

```
$ nodal db:create
```

Generally, Nodal commands transparently log their activity.
In the case of `db:create` we get something like this in our console:

```
CREATE DATABASE "instatweet_api_development"
[]
730ms

Database Info: Created empty database "instatweet_api_development"
```

This explicitly shows the Postgres command executed to create our empty database, as well as the name of our db.

Next we run:

```
$ nodal db:prepare
```
This empties out our database and prepares for migration.

To run our migration we use:

```
$ nodal db: migrate
```

This creates the tables in our database.

To rollback a migration, we use:

```
$ nodal db:rollback
```

This rolls our database back to a prior migration

Migrating will roll our database forward again:

```
$ nodal db:migrate
```

Every migration or rollback will print the schema of the current migration to the console for us, so we can keep track of what our database looks like at any moment.

Additionally, running `db:migrate` when a new migration doesn't exist will return a message saying "no pending migrations exist". Running db:rollback without having completed any migrations in the first place will throw an error. You can see the guide for migrations and rollbacks for more detail.

## Back to Controllers: Let's make an api endpoint

At this point we have a database, a tweet table in that database, a tweet model for interacting with that tweet table, and a tweet schema that describes our tweet in our model and our Postgres table. But we don't have a way to communicate with our Nodal instatweet-api externally. We need an API endpoint. For that we need to generate a controller that interfaces with our tweet model. In Nodal, we can generate controllers for specific models, and we can namespace our controllers and API endpoints, all in one command:

```
$ nodal g:controller v1 --for Tweet
```

The Nodal generators are smart enough to know that Tweet is a model that we've already created. Therefor we can use a flag to specify that we'd like to create a controller for a specific model.

Additionally, we can namespace the controller for our model. The name space is then added to the URL path for our API end point. In this case "v1" is our namespace, which will give us an API end point for tweets that we can access at:

```
localhost:3000/v1/tweet
```

As we build features of our API, we can use namespaces to organize those API end points. Practically speaking we could develop v2 of our API, while still maintaining v1 in production.

So what does `g:controller v1 --for Tweet` get us? We can check our console:

```
Create: ./app/controllers/v1/tweets_controller.js
Modify: ./app/router.js
```

First, we create our v1 name-spaced tweets_controller. The controllers that Nodal generates provide index, show, create, update and destroy methods, which all correspond to simple CRUD operations. The design pattern implemented here is based on frameworks like Rails.

Omitting the IIFE wrapper implementation detail, our tweets controller, looks like this:

```javascript
// ./app/controllers/v1/tweets_controller.js
const Nodal = require('nodal');
const Tweet = Nodal.require('app/models/tweet.js');

class V1TweetsController extends Nodal.Controller {

  index() {

    Tweet.query()
      .where(this.params.query)
      .end((err, models) => {

        this.respond(err || models);

      });

  }

  show() {

    Tweet.find(this.params.route.id, (err, model) => {

      this.respond(err || model);

    });

  }

  create() {

    Tweet.create(this.params.body, (err, model) => {

      this.respond(err || model);

    });

  }

  update() {

    Tweet.update(this.params.route.id, this.params.body, (err, model) => {

      this.respond(err || model);

    });

  }

  destroy() {

    Tweet.destroy(this.params.route.id, (err, model) => {

      this.respond(err || model);

    });

  }

}
```

Let's see if we can hit this endpoint.

Using Postman, or curl, or whatever your favorite way to test an API endpoint, lets hit `localhost:3000/v1/tweets` with a GET request.

Our response should look like this:

```json
{
  "meta": {
      "total":0,
      "count":0,
      "offset": 0,
      "error": null
    },
  "data": []
}
```

## Router

What was actually happening when we hit that tweets endpoint?

Along with generating a controller, the generator command modified `./app/router.js.`

```
Create: ./app/controllers/v1/tweets_controller.js
Modify: ./app/router.js
```

There are a couple things going on the router that aren't pertinent to this tutorial. You can check out the guides to middleware and renderware if you're curious. Highlighting the bits to focus on, we can see that we have a route for every controller in our API, like our index controller from the start of the tutorial. When Nodal generates a controller, it explicitly required that controller into the router and generates a route for that controller as well:

```javascript{19-23,27-31}
// ./app/router.js
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const router = new Nodal.Router();

  /* Middleware */
  ...

  /* Renderware */
  ...

  /* Routes */

  const IndexController = Nodal.require('app/controllers/index_controller.js');

  /* generator: begin imports */

  const V1TweetsController = Nodal.require('app/controllers/v1/tweets_controller.js');

  /* generator: end imports */

  router.route('/').use(IndexController);

  /* generator: begin routes */

  router.route('/v1/tweets/{id}').use(V1TweetsController);

  /* generator: end routes */

  return router;

})();
```

The Nodal generator explicitly required our namespaced tweets controller, created a regex for it, and created our new route for us.

Nodal implements routes using a regex waterfall, where requests fall through each regex until the requested url string finds a regex match.

## Testing our Tweets endpoint

Now that we've built our tweets endpoint, let's test it by sending a POST request with they word "Hey" in the body to `/v1/tweets`

Using Postman, we send our data using the `x-www-form-urlencoded` option.
￼
Or if you want to use curl from the command line:

```
curl -d "body=hey" localhost:3000/v1/tweet
```

We'll assume you have a favorite way to test your API end points, and leave the choice of how to hit your API up to you.

The `/v1/tweets` endpoint handles our POST request and responds with the data we sent in our POST request, which matches our definition of our tweet model. It also responds with an updated response metadata. All Nodal API responses adhere to this format.

```json
 {
  "meta": {
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 1,
      "user_id": null,
      "body": "Hey",
      "created_at": "2016-04-08T08:46:18.069Z"
    }
  ]
}
```

## Creating tweets with actual content

Let's keep on hitting the API with POST requests containing some other text in the body:

"Hello"

"Hello, world!"

"Goodbye, world!"

"Goodbye, friend!"

"Hello, friend!"

After every request we should see a response of the same format as:

```json
{
  "meta": {
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 6,
      "user_id": null,
      "body": "Hello, friend!",
      "created_at": "2016-04-08T08:47:12.063Z"
    }
  ]
}
```

Great! We can persist data at our API!

## Feature: API Input Validation

One of the features we want to implement with our instatweet-API is input validation. That is we want to be able to reject requests to our API that have invalid input. This is an important part of maintaining an API, and Nodal makes it easy by providing input validation out of the box. We can use our tweet model to validate input using the .validates method, which takes as arguments:

* the field to validate

* the text string to respond with in the case that validation fails

* and an anonymous function that will evaluate to true or false using the data in the designated input field.

Let's validate the body of our POST request to make sure that it both exists and is longer than 5 characters.

```javascript{13}
// ./app/models/tweet.js
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class Tweet extends Nodal.Model {}

  Tweet.setDatabase(Nodal.require('db/main.js'));
  Tweet.setSchema(Nodal.my.Schema.models.Tweet);

  Tweet.validates('body', 'must be at least 5 characters', v => v && v.length >= 5);

  return Tweet;

})();
```

Then let's test it by sending a POST request with "Hey!" in the body. We should get a validation error!

```json
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": {
      "message": "Validation error",
      "details": {
        "body": [
          "must be at least 5 characters"
        ]
      }
    }
  },
  "data": []
}
```

Now let's POST "Hey there" and we get a non-error response.

```json
{
  "meta": {
    "total": 1,
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 7,
      "user_id": null,
      "body": "Hey there",
      "created_at": "2016-04-08T08:48:13.073Z",
      "updated_at": "2016-04-08T08:48:13.075Z"
    }
  ]
}
```

## Query Strings

If we hit `localhost:3000/v1/tweets` with a GET request, we'll get all of our tweets back to us in the body of the response.

Nodal comes with support for multiple query strings:

Here are a couple we can test:

```
localhost:3000/v1/tweets?body__not_null

localhost:3000/v1/tweets?body__startswith=he
```

`body__startswith=he` doesn't work because the query is case sensitive.

```
localhost:3000/v1/tweets?body__startswith=He

localhost:3000/v1/tweets?body__endswith=friend!
```

For case insensitive we use `iendswith`:

```
localhost:3000/v1/tweets?body__iendswith=frieNd!
```

For integer values, we can do greater-than-or-equal-to queries

```
localhost:3000/v1/tweets?id__gte=3
```

This will give us a response containing all tweets for which the ID is greater-than-or-equal-to 3.

```
localhost:3000/v1/tweets?id__gte=3&__count=2

localhost:3000/v1/tweets?id__gte=3&__offset=2&__count=2
```

How's this all working? Is this magic, or does the developer have fine grained control over responding to query strings?

If we look in our `tweets_controller.js` file, what we see is the chain of methods invoked on the query params

```javascript{6}
// ./app/controllers/v1/tweets_controller.js

class V1TweetsController extends Nodal.Controller {
  index(){
    Tweet.query()
       .where(this.params.query)
       .end((err, models) => {

          this.respond(err || models);

      });
  }
}
```

We can actually specify conditions for the response directly as an option hash of properties passed to `.where()`:

We can replace this.params.query with something like `{id__gte: 3}`:

```javascript{6}
// ./app/controllers/v1/tweets_controller.js

index() {

  Tweet.query()
  .where({id__gte: 3})
  .end((err, models) => {

    this.respond(err || models);
  });

}
```

Now no matter our query string, we'll only get tweets that match the option hash passed to the `.where()` method. The query string and `.where()` option hash argument syntax is borrowed directly from Django's ORM.

## Deleting Our Tweets

Using the exact same query string we can also DELETE a tweet using a DELETE request to that same endpoint:

```
localhost:3000/v1/tweets/7
```

The Nodal server will respond with the tweet we're deleting, which is the tweet with ID 7.

```json
{
  "meta": {
    "total": 1,
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 7,
      "user_id": null,
      "body": "Hello, friend!",
      "created_at": "2016-04-08T22:59:11.858Z",
      "updated_at": "2016-04-08T22:59:11.861Z"
    }
  ]
}
```

Let's double check by sending another DELETE request using the same query string:

```
localhost:3000/v1/tweets/7
```

```
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": {
      "message": "Could not find Tweet with id \"7\"."
    }
  },
  "data": []
}
```

If we send a GET request to `localhost:3000/v1/tweets` we'll see that our tweet with ID 7 is gone.

We can also go back through our server log, which is active in the terminal window where we started our Nodal server, and we can see the log of the tweet being deleted.

```
DELETE FROM "tweets" WHERE ("id") = ($1) RETURNING *
[7]
29ms
```

## A User Model and Authentication

Now that we've covered the basics, the tutorial will speed up a bit.

Nodal provides a generator for creating the foundation of a user model. We can use Nodal's command line generator flag --user to generate a user model. This flag does a lot under the hood, but at this point we're equipped to reason through what Nodal generates. The Nodal command to generate a user model is:

```
$ nodal g:model --user
```

You'll notice that this command takes a bit longer to run. That's because Nodal is installing dependencies for password security, encryption and hashing; specifically the bcrypt package. As always Nodal logs the files that it generates:

```
Create: ./app/models/user.js
Create: ./db/migrations/2016041500085963__create_user.js
```

> NOTE: If you run into problems with Nodal generators, remember that Nodal generators will log the changes made to your server. If, for example, you need to generate your user model again, you can remove the files that Nodal generated, and rerun generator commands from the command line. For example, if `$ nodal g:model --user` throws an error because installation of bcrypt required super user privileges, you can remove the generated files and then run `$ sudo nodal g:model --user`. Nodal generators are explicit, transparent and modular so that the developer can maintain fine grain control of their server.

As in our tweet model, Nodal generates a new migration in our `db/migrations` directory, which –upon migration– creates a users table with three fields.

* email

* password

* username.

Additionally, if you inspect the generated migration code, you'll see an example of setting properties on a data field in a Postgres table, and specifically that the email field must be unique.

```js{18}
//db/migrations/UTCTimestamp__create_user.js
module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class CreateUser extends Nodal.Migration {

    constructor(db) {
      super(db);
      this.id = 2016041423195808;
    }

    up() {

      return [
        this.createTable("users", [{"name":"email","type":"string","properties":{"unique":true}},{"name":"password","type":"string"},{"name":"username","type":"string"}])
      ];

    }

    down() {

      return [
        this.dropTable("users")
      ];

    }

  }

  return CreateUser;

})();
```

The Nodal model generator, with the --user flag also generated a user model for us. Ignoring the boiler plate, the generator created a model that requires the bcrypt package, implements a `beforeSave()` method, implements a password verification, sets our database and user model schema, and invokes two input validations on email and password inputs to our user API end point.

One step at a time that's:

* Requires the bcrypt package

* Implements a `beforeSave()` method. This method is invoked before data is saved to the database.

* Implements password verification.

* Sets our database and user model schema.

* Invokes two input validations on email and password inputs.

```javascript{6-7,11-32,34-42,44-45,47-48}
// ./app/models/user.js
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const bcrypt = require('bcrypt');

  class User extends Nodal.Model {

    beforeSave(callback) {

      if (!this.hasErrors() && this.hasChanged('password')) {

        bcrypt.hash(this.get('password'), 10, (err, hash) => {

          if (err) {
            return callback(new Error('Could not encrypt password'));
          }

          this.__safeSet__('password', hash);
          callback();

        });

      } else {

        callback();

      }

    }

    verifyPassword(unencrypted, callback) {

      bcrypt.compare(unencrypted, this.get('password'), (err, result) => {
        callback.call(this, err, result);
      });

    }

  }

  User.setDatabase(Nodal.require('db/main.js'));
  User.setSchema(Nodal.my.Schema.models.User);

  User.validates('email', 'must be valid', v => v && (v + '').match(/.+@.+\.\w+/i));
  User.validates('password', 'must be at least 5 characters in length', v => v && v.length >= 5);

  return User;

})();
```

This might seem like a lot to parse. But we're equipped to reason through it. Let's try to narrow our scope a bit, by referencing pieces of this generated code that are similar to our tweets model:

Requiring bcrypt is pretty straightforward. The generator downloaded the bcrypt package into our node_modules folder. We'll be using methods from the bcrypt package to compare and encrypt our passwords.

Setting the database and user model schema is part of the migrations design pattern. We can trust that our migrations handle the concerns of our database.

Additionally, we covered validations earlier, so we don't need to pay close attention to the two invocations of `User.validates()`.

That leaves the `beforeSave()` and the `verifyPassword()` methods!

In our `beforeSave()` method, if the request being handled by our user model is not throwing an error, and the password is being changed, we'll handle any encryption errors, and encrypt the password followed by using `__safeSet__` to set the password field of our user model to a hash of the password. `__safeSet__` is just a set without validation.

`verifyPassword()` just uses bcrypt's compare method to compare passwords sent to the user model.

## Migration

To actually get our user model up and running, we just need to migrate!

```
$ nodal db:migrate
```

You should see output from Postgres in your console detailing the tables created.

## Controller

Let's see what happens if we try to hit our user endpoint with a GET request:

```
localhost:3000/v1/users
```

We'd get a 404!

Why? Because while we used Nodal to generate a model, we haven't built a controller for that model.

We can create our controller for our specific user model using the same generator command as we did for our tweets, but specifying that our controller is for our User model.

```
$ nodal g:controller v1 --for User
```

You should see in your console the changes that the Nodal generator has made to your server:

```
Create: ./app/controllers/v1/users_controller.js
Modify: ./app/router.js
```

Nodal generated a new controller, and edited our router. This controller handles all of the same CRUD functionality that we had for our tweets, but now for our users! Also remember that we've name-spaced our controllers to v1, so your Nodal API server should now have an endpoint available at `app/controllers/v1/users_controller.js` file. It should be nearly identical to the `tweets_controller.js` file.

## Creating users

Let's make a GET request to `localhost:3000/v1/users`.

We get a response that indicates that we don't have any users. Good!

```json
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": null
  },
  "data": []
}
```

Now lets make an empty POST request to `/v1/users`

We get a validation error, telling us our email must be valid and our password must be at least 5 characters in length.

```json
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": {
      "message": "Validation error",
      "details": {
        "email": [
          "must be valid"
        ],
        "password": [
          "must be at least 5 characters in length"
        ]
      }
    }
  },
  "data": []
}
```

Let's send a valid email, password and username in our post request.

* email = keithwhor@gmail.com 

* password = password 

* username = keithwhor 

And what do we get?

A response with our new user, indicating their email, their encrypted password and their username.

```json
{
  "meta": {
    "total": 1,
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 1,
      "email": "keithwhor@gmail.com",
      "password": "$2a$10$iKYZj7e18yr7qmhFhPQYPuTstzeuct3SXQrEzdxc8qLUd.Vykt8fS",
      "username": "keitwhor",
      "created_at": "2016-04-08T23:01:12.835Z",
      "updated_at": "2016-04-08T23:01:12.984Z"
    }
  ]
}
```

Generally, we don't want to be sending around hashes of our users passwords. Nodal generators, however, make no assumptions about API response fields. Generators intentionally leave these hashed passwords in the default response to allow the API developer to manage the concern of security as necessary. Nodal will get you set up with the right hashing and encryption tools, but it's your job to make sure your Nodal server meets your security specification.

You can see that our Nodal API will respond to a GET request to `/v1/users/` with this same information, since we only have one user at the moment:

```json
{
  "meta": {
    "total": 1,
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 1,
      "email": "keithwhor@gmail.com",
      "password": "$2a$10$iKYZj7e18yr7qmhFhPQYPuTstzeuct3SXQrEzdxc8qLUd.Vykt8fS",
      "username": "keitwhor",
      "created_at": "2016-04-08T23:01:45.510Z",
      "updated_at": "2016-04-08T23:01:45.621Z"
    }
  ]
}
```

Let's fix the response interface so that we don't send the hashed password field in our response.

## API Endpoint Response Interface

Our `users_controller.js` file is where we specify the response data to API requests. We can specify an interface to describe those responses. We can edit any of our responses by adding an array specifying what model data we want to send in our response. In this case we'll add `['id','username','email','created_at']` as an argument to `this.respond()` on our index method in our `users_controller.js` file, which corresponds to a GET request to `/v1/users/` endpoint.

```javascript{8}
// ./app/controllers/v1/users_controller.js
index() {

User.query()
  .where(this.params.query)
  .end((err, models) => {

    this.respond(err || models, ['id','username','email','created_at']);

  });

}
```

Now that we've specified this interface, our requests get a response that only contains the data specified in the array passed to the `.respond()` method. If we send a GET request to `localhost:3000/v1/users` we get the following response, which corresponds to the interface we specified in the controller.

```json
{
  "meta": {
    "total": 1,
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 1,
      "username": "keitwhor",
      "email": "keithwhor@gmail.com",
      "created_at": "2016-04-15T16:52:54.835Z"
    }
  ]
}
```

We have fine grained control over what data we send whenever we respond with any sort of model. You might want to go specify the interfaces for the rest of the generated API endpoints in out users_controller.js file!

## Associating Models

Now that we have tweets, and we have users, how do we use Nodal to associate tweets with users?

All of our tweets have a `user_id` associated with them. We can use that `user_id` field to associate tweets with a specific user, based on joining their IDs,

Not only that, we can do this right in our tweet model!

First we require our User model into tweet.js.

Then we can use the `Nodal.Model.joinsTo` method to join our tweet model to our user model, with a specification that a User has multiple tweets

```javascript{7,14}
// ./app/models/tweet.js
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const User = Nodal.require('app/models/user.js');

  class Tweet extends Nodal.Model {}

  Tweet.setDatabase(Nodal.require('db/main.js'));
  Tweet.setSchema(Nodal.my.Schema.models.Tweet);

  Tweet.joinsTo(User, {multiple:true});

  Tweet.validates('body', 'must be at least 5 characters', v => v && v.length >= 5);

  return Tweet;

})();
```

`joinsTo` and `{multiple:true}` is a combination of two associations from Rails: `has_many` and `belongs_to`. Additionally Nodal is strict about being "bottom up" with joins. Because Nodal is explicit about dependencies, we need to avoid cyclical joins; Nodal won't magically resolve them for you. Therefor the parent ID should always be in a child table, and never the other way around. Tweets belong to Users. Users are the parents, tweets are their children.

Therefor we always go to the child model, require the parent, and `doChild.joinsTo(Parent, {multiple:true})`

## Query Strings on Joined Tables

Now we can do some fun things with our API.

```
localhost:3000/v1/tweets?user__username=keithwhor
```

This should give us all the tweets that share a `user_id` with the the id associated with the username "keithwhor"! Which at this point, is no tweets! None of the tweets that we sent in POST requests to our API had a `user_id` field. They all have a `"user_id": null`

```json
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": null
  },
  "data": []
}
```

We can see this if we send a GET request to the `/v1/tweets` endpoint.

```json
{
  "meta": {
    "total": 6,
    "count": 6,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 1,
      "user_id": null,
      "body": "Hey",
      "created_at": "2016-04-08T08:35:29.229Z",
      "updated_at": "2016-04-08T08:35:29.236Z"
    },
    {
      "id": 2,
      "user_id": null,
      "body": "Hello",
      "created_at": "2016-04-08T08:43:41.132Z",
      "updated_at": "2016-04-08T08:43:41.137Z"
    },
    {
      "id": 3,
      "user_id": null,
      "body": "Hello, world\\!",
      "created_at": "2016-04-08T08:44:01.251Z",
      "updated_at": "2016-04-08T08:44:01.258Z"
    },
    {
      "id": 4,
      "user_id": null,
      "body": "Goodbye, world\\!",
      "created_at": "2016-04-08T08:44:43.373Z",
      "updated_at": "2016-04-08T08:44:43.379Z"
    },
    {
      "id": 5,
      "user_id": null,
      "body": "Goodbye, friend\\!",
      "created_at": "2016-04-08T08:45:13.263Z",
      "updated_at": "2016-04-08T08:45:13.269Z"
    },
    {
      "id": 6,
      "user_id": null,
      "body": "Hello, friend\\!",
      "created_at": "2016-04-08T08:46:12.063Z",
      "updated_at": "2016-04-08T08:46:12.067Z"
    }
  ]
}
```

Let's take a second and use our API to set up some mock data. We want to demonstrate that our API can handle multiple users, each with multiple tweets. So let's create a new user with a POST request to `/v1/users` with the following fields:

* email = jill@gmail.com 

* password = password 

* username = jill 

This is our second user, since we already created username keithwhor earlier.

Then let's create 3 tweets for each user. This can be done in 6 POST requests to our `/v1/tweets` endpoint; 3 with `user_id = 1` and 3 with `user_id = 2`.

With `user_id = 1` lets post the following in the body:

"Hello!"

"Hello friend!"

"Hello world!!"

With `user_id = 2` lets post the following in the body:

"Hey there!"

"Hey there friend!"

"Hey there world!!"

Now say we wanted the users data along with all of the users tweets?

Now we can query for tweets based on usernames. A GET request to:

```
localhost:3000/v1/tweets?user__username=keithwhor
```

Should give us:

```json
{
  "meta": {
    "total": 3,
    "count": 3,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 8,
      "user_id": 1,
      "body": "Hello!",
      "created_at": "2016-04-15T19:28:50.700Z",
      "updated_at": "2016-04-15T19:28:50.710Z"
    },
    {
      "id": 9,
      "user_id": 1,
      "body": "Hello friend!",
      "created_at": "2016-04-15T19:29:06.059Z",
      "updated_at": "2016-04-15T19:29:06.060Z"
    },
    {
      "id": 10,
      "user_id": 1,
      "body": "Hello world!",
      "created_at": "2016-04-15T19:29:11.157Z",
      "updated_at": "2016-04-15T19:29:11.157Z"
    }
  ]
}
```

And similarly a GET request to:

```
localhost:3000/v1/tweets?user__username=jill
```

Should give us:

```json
{
  "meta": {
    "total": 3,
    "count": 3,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 11,
      "user_id": 2,
      "body": "Hey there!",
      "created_at": "2016-04-15T19:29:26.779Z",
      "updated_at": "2016-04-15T19:29:26.779Z"
    },
    {
      "id": 12,
      "user_id": 2,
      "body": "Hey there friend!",
      "created_at": "2016-04-15T19:29:31.423Z",
      "updated_at": "2016-04-15T19:29:31.423Z"
    },
    {
      "id": 13,
      "user_id": 2,
      "body": "Hey there world!",
      "created_at": "2016-04-15T19:29:35.908Z",
      "updated_at": "2016-04-15T19:29:35.908Z"
    }
  ]
}
```

## Joins and Response Interfaces

You'll notice that while this query returns all the tweets belonging to the userid of the username passed to the query string, the response doesn't actually contain the user information itself.

We can fix this easily by going to our tweets_controller and joining the user data into our `index()` method which handles GET requests to our tweets endpoint.

First we user the query composer `join()` method to join the user model into the response. Second, we also specify the interface for the response.

Let's say in our response, we want to show the tweet `id`, `body` and `created_at`, and only show the `user_id`, `username` and `created_at`. Our interface for the Tweet model `query()` joined with the User model would be

```javascript
['id', 'body','created_at', {user: ['id', 'username', 'created_at']}]
```

```javascript{18}
// ./app/controllers/v1/tweets_controller.js
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const Tweet = Nodal.require('app/models/tweet.js');

  class V1TweetsController extends Nodal.Controller {

    index() {

      Tweet.query()
        .join('user')
        .where(this.params.query)
        .end((err, models) => {

          this.respond(err || models, ['id', 'body','created_at', {user: ['id', 'username', 'created_at']}]);

        });

    }

    ...

  }

}
```

The string passed to the `.join()` is a reference to the model we would like to join. The reference syntax is just the Camel-case of the class name that we want to join.

Now our request to `/v1/tweets?user__username=keithwhor` will respond with user data associated with each tweet.

```json
{
  "meta": {
    "total": 3,
    "count": 3,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 8,
      "body": "Hello!",
      "created_at": "2016-04-15T19:28:50.700Z",
      "user": {
        "id": 1,
        "username": "keithwhor",
        "created_at": "2016-04-15T19:16:09.301Z"
      }
    },
    {
      "id": 9,
      "body": "Hello friend!",
      "created_at": "2016-04-15T19:29:06.059Z",
      "user": {
        "id": 1,
        "username": "keithwhor",
        "created_at": "2016-04-15T19:16:09.301Z"
      }
    },
    {
      "id": 10,
      "body": "Hello world!",
      "created_at": "2016-04-15T19:29:11.157Z",
      "user": {
        "id": 1,
        "username": "keithwhor",
        "created_at": "2016-04-15T19:16:09.301Z"
      }
    }
  ]
}
```

## Access tokens

Generally speaking, if there exists a Nodal generator for some piece of our API server, we want to use it. Getting familiar with Nodal generators is one of the goals of this tutorial.

Nodal provides a generator for access tokens/session management.

```
$ nodal g:model --access_token
```

This Nodal generator command generates two files:

```
Create: ./app/models/access_token.js
Create: ./db/migrations/UTCTimeStamp__create_access_token.js
```

Our `./app/models/access_token.js` file has a lot going on. As always, we're equipped to interpret what Nodal has generated. This should begin to look familiar.

Access tokens rely on verification of a user. If we look in `./app/models/access_token.js` we'll see an explicit import of the user model. Additionally, the access token model that Nodal generates uses the crpyto library –which we require explicitly– for generating access tokens.

The static method `generateAccessTokenString()` uses `crypto` to generate an access token string.

```javascript{7,9}
// ./app/models/access_token.js
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const User = Nodal.require('app/models/user.js');

  const crypto = require('crypto');

  class AccessToken extends Nodal.Model {

    static generateAccessTokenString() {

      return crypto
        .createHmac('md5', crypto.randomBytes(512).toString())
        .update([].slice.call(arguments).join(':'))
        .digest('hex');

    }

    static login(params, callback) {

      if (params.body.grant_type !== 'password') {
        return callback(new Error('Must supply grant_type'));
      }

      User.query()
        .where({username: params.body.username})
        .end((err, users) => {

          if (err || !users || !users.length) {

            return callback(new Error('User not found'));

          }

          let user = users[0];

          user.verifyPassword(params.body.password, (err, result) => {

            if (err || !result) {

              return callback(new Error('Invalid credentials'));

            }

            new AccessToken({
              user_id: user.get('id'),
              access_token: this.generateAccessTokenString(user.get('id'), user.get('email'), new Date().valueOf()),
              token_type: 'bearer',
              expires_at: (new Date(new Date().valueOf() + (30 * 24 * 60 * 60 * 1000))),
              ip_address: params.ip_address
            }).save(callback);

          });

        });

    }

    static verify(params, callback) {

      this.query()
        .join('user')
        .where({
          access_token: params.auth.access_token,
          expires_at__gte: new Date()
        })
        .end((err, accessTokens) => {

          if (err || !accessTokens || !accessTokens.length) {

            return callback(new Error('Your access token is invalid.'));

          }

          let accessToken = accessTokens[0];

          if (!accessToken.joined('user')) {

            return callback(new Error('Your access token belongs to an invalid user.'));

          }

          return callback(null, accessToken, accessToken.joined('user'));

        });

    }

    static logout(params, callback) {

      this.verify(params, (err, accessToken) => {

        if (err) {
          return callback(err);
        }

        return accessToken.destroy(callback);

      });

    }

  }

  AccessToken.setDatabase(Nodal.require('db/main.js'));
  AccessToken.setSchema(Nodal.my.Schema.models.AccessToken);

  AccessToken.joinsTo(User, {multiple: true});

  return AccessToken;

})();
```

Then we also have `login()`, `verify()` and `logout()` which manage the creation, verification and destruction of our token. We won't dissect these implementations in depth. Instead, use them as reference for the patterns you might following in structuring your own specific `model` methods.

Nodal generators produce functioning code. Lets see if we can get our access tokens up and running.

Remember that every time we generate a new model, Nodal generates new migration. To create the table corresponding to the generated model, we need to migrate!

```
$ nodal db:migrate
```

You can check your console for a log of the Postgres commands for creating our access token table.

Our access token model also needs a controller. Remember that Nodal generators make it straightforward to link models and controllers using the `--for` flag:

```
nodal g:controller v1 --for AccessToken
```

As always, our a log of the files generated and modified is available in our console:

```
Create: ./app/controllers/v1/access_tokens_controller.js
Modify: ./app/router.js
```

At this point we've used our generator to build a controller that by default contains methods for handling standard CRUD operations. But we actually don't need any of those methods for access tokens.

So lets go to `./app/controllers/v1/access_tokens_controller.js` and erase all those generated methods and build our first Nodal controller from just-about-scratch.

First we need a method for creating an access token. To do this we use the login() method on the AccessToken model, inside of the access token controller's create() method. The login method takes two arguments, the first is the params passed to the request, and the second is the callback, which we'll use to generates the response on login.

```javascript{11-17}
// ./app/controllers/v1/access_tokens_controller.js
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const AccessToken = Nodal.require('app/models/access_token.js');

  class V1AccessTokensController extends Nodal.Controller {

    create() {
      AccessToken.login(this.params, (err, accessToken) => {

        this.respond(err || accessToken);

      });
    }

  }

  return V1AccessTokensController;

})();
```

Let's test this out to see how it works, starting with a GET request to `localhost:3000/v1/access_tokens`

We get a 501 - Not Implemented

```json
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": {
      "message": "Not Implemented"
    }
  },
  "data": []
}
```

This makes sense! Our access_tokens controller doesn't have a defined `index()` or `show()` method. We erased them both! And we've only implemented a create() method, which corresponds to handling a POST request.

So now let's do a POST to `/v1/access_tokens`.

And we get a response! In the response we see an error message "Must supply grant_type"

```
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": {
      "message": "Must supply grant_type"
    }
  },
  "data": []
}
```

If we go into `app/models/access_token.js` and look at the login method

```javascript{7}
//app/models/access_token.js

static login(params, callback){

  if (params.body.grant_type !== 'password'){

    return callback(new Error('Must supply grant_type'));

  }

  ...

}
```

we see the exact error that we just received in our response!

A `grant_type` is part of the OAuth spec, and you can read a useful blog post about grant_types [here](http://alexbilbie.com/2013/02/a-guide-to-oauth-2-grants/).

Let's add a `grant_type = password` to our POST request

Now the response to our POST request gives us a "User not found" error! So our `grant_type` worked.

```json
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": {
      "message": "User not found"
    }
  },
  "data": []
}
```

Let's go look at what else is happening in our access token model. After our `grant_type` check we have our query composer method chain!

```javascript
//app/models/access_token.js

...

User.query()
  .where({username: params.body.username})
  .end((err, users) => {

    if (err || !users || !users.length) {

      return callback(new Error('User not found'));

      }

    ...

   })
```

So let's supply a `username = keithwhor` in our POST request!

And now we get an "Invalid credentials" error message!

```
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": {
      "message": "Invalid credentials"
    }
  },
  "data": []
}
```

Great! We know where that's probably coming from!

```javascript{15}
//app/models/access_token.js

User.query()
  .where({username: params.body.username})
  .end((err, users) => {

    ...

    let user = users[0];

    user.verifyPassword(params.body.password, (err,result) => {

      if (err || !result) {

        return callback(new Error('Invalid credentials'));

      }

  })
```

Sure enough there's our 'Invalid credentials' error.

So let's provide some credentials! Specifically, lets provide `password = password` in our POST request.

```json
{
  "meta": {
    "total": 1,
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "access_token": "7142a4ea7b14b7774e1ef8ae3ec6f1ce",
      "token_type": "bearer",
      "expires_at": "2016-05-15T21:11:57.219Z",
      "ip_address": null,
      "created_at": "2016-04-15T21:11:57.219Z",
      "updated_at": "2016-04-15T21:11:57.221Z"
    }
  ]
}
```

Great! We generated an access token for a unique user!

## Using Our Authentication Token

At this point, if we send a POST request to `/v1/tweets` with text in the body, that text will be saved to the database. But the whole point of authentication is that we don't want non-registered users to be able to post tweets to our API. How do we use our access token to verify that a POST request to our API is coming from a registered, authenticated, logged-in user?

Since this is a POST request to `/v1/tweets` the right place to start is at the `tweets_controller.js` file, and specifically the `create()` method in that file. Right now it doesn't have any kind of user verification logic. It just looks like this:

```js
create() {

  Tweet.find(this.params.id, (err, model) => {

    this.respond(err || model);

  });

}
```

When we create a controller using the Nodal generator, by default our generated controller will extend the `Nodal.Controller` class, while defining our 5 CRUD methods.

```js
class V1TweetsController extends Nodal.Controller {

  index(){...}
  show(){...}
  create(){...}
  update(){...}
  destroy(){...}

}
```

We can replace the default `Nodal.Controller` with an `AuthController` by requiring `./app/controllers/auth_controller.js` into our `tweets_controller` and then replacing `Nodal.Controller` with `AuthController`.

```javascript{2,4}
//app/controllers/tweets_controller.js
const AuthController = Nodal.require('app/controllers/auth_controller.js');

class V1TweetsController extends AuthController {
  index(){...}
  show(){...}
  create(){...}
  update(){...}
  destroy(){...}
}
```

The `AuthController` itself also extends the `Nodal.Controller`, including all the methods we've been using for our basic API end points, but provides an additional `authorize()` method.

```javascript{10-17}
// ./app/controllers/auth_controller.js
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class AuthController extends Nodal.Controller {

    authorize(callback) {

      this.setHeader('Cache-Control', 'no-store');
      this.setHeader('Pragma', 'no-cache');

      callback(null);

    }

  }

  return AuthController;

})();
```

Now we can go into the `create()` method of our Tweet controller, and use the `authorize()` method from the AuthController! And we can wrap our tweet creation logic in a callback that gets passed to authorize!

Specifically, we'll pass an anonymous function as the callback to `this.authorize()`. That callback will be provided error object, an access token and our user. You can check the function signature of our `AuthController` `authorize()` method to see that the callback it takes as an argument is up to us to define. We'll use `authorize()` to `verify()` the user and then upon verification, invoke our callback. Our callback, after handling any errors, will use the tweet model's `create()` method to create a tweet.

That create methods looks like this:

```javascript{17-35}
// ./app/controllers/v1/tweets_controller.js
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const Tweet = Nodal.require('app/models/tweet.js');

  const AuthController = Nodal.require('app/controllers/auth_controller.js');

  class V1TweetsController extends AuthController {

    index() {...}

    show() {...}

    create(){

      this.authorize((err, accessToken, user) => {

        if (err) {

          return this.respond(err);

        }

        Tweet.create(this.params.body, (err, model) => {

          this.respond(err || model);

        });

      });

    }

    update() {...}

    destroy() {...}

  }

  return V1TweetsController;

})();
```

Then let's go to `auth_controller.js` and build out some authentication logic.

Step 1 is to require our AccessToken model, so that we're able to verify that the access token exists in our access token table in our database.

Step 2 is to use the `.verify()` method on our AccessToken model, and pass it the username and access token string, which it can use to check against the usernames and granted access tokens in the database. We also pass our callback to `.verify()`. You can go look at the function signature of the access token model's `.verify()` method to see what it does with our params and our callback. After these changes, our new AuthController will look like this:

```js{7,16}
//app/controllers/auth_controller.js
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const AccessToken = Nodal.require('app/models/access_token.js');

  class AuthController extends Nodal.Controller {

    authorize(callback) {

      this.setHeader('Cache-Control', 'no-store');
      this.setHeader('Pragma', 'no-cache');

      AccessToken.verify(this.params, callback);

    }

  }

  return AuthController;

})();
```

Now let's hit our tweets endpoint again with a POST request! There's one more thing that we'll have to fix!

```json
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": {
      "message": "Your access token is invalid."
    }
  },
  "data": []
}
```

We get an error message telling us that we're missing our access token!

So let's add our access token as a query parameter!

```
localhost:3000/v1/tweets?access_token=7142a4ea7b14b7774e1ef8ae3ec6f1ce
```

And it posted! But the new user is still null!

```json
{
  "meta": {
    "total": 1,
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 14,
      "user_id": null,
      "body": "I'm authenticated!",
      "created_at": "2016-04-15T23:38:45.121Z",
      "updated_at": "2016-04-15T23:38:45.122Z"
    }
  ]
}
```

Let's quick fix that in our controller's create method, by adding this line:

```javascript
// ./app/controllers/v1/tweets_controller.js
create() {

  this.authorize((err, accessToken, user) => {

    if (err) {

      return this.respond(err);

    }

    this.params.body.user_id = user.get('id');

    Tweet.create(this.params.body, (err, model) => {

      this.respond(err || model);

    });

  });

}
```

And we're there! A post to:

```
localhost:3000/v1/tweets?access_token=7142a4ea7b14b7774e1ef8ae3ec6f1ce
```

Gets a response with the `user_id` corresponding to the access token:

```json
{
  "meta": {
    "total": 1,
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 15,
      "user_id": 1,
      "body": "I'm authenticated, and I'm a user!",
      "created_at": "2016-04-15T23:46:43.952Z",
      "updated_at": "2016-04-15T23:46:43.954Z"
    }
  ]
}
```

No access token? Rejected!

```json
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": {
      "message": "Your access token is invalid."
    }
  },
  "data": []
}
```

Access token? Accepted!

```json
{
  "meta": {
    "total": 1,
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 16,
      "user_id": 1,
      "body": "I got my access token!",
      "created_at": "2016-04-15T23:50:12.806Z",
      "updated_at": "2016-04-15T23:50:12.809Z"
    }
  ]
}
```

## Refactoring

At this point, Nodal has given us a lot. And it's up to us to refine our implementation of our server logic.

Let do a quick refactor that will highlight some useful pieces of how Nodal is written, and give you an idea of how you as the developer can choose how to best extend Nodal for your API server.

We can actually refactor the error logic in our `tweets_controller.js` `create()` method, by removing it from the callback that we pass to `authorize()`:

```javascript{6-10}
//app/controllers/v1/tweets_controller.js
create() {

  this.authorize((err, accessToken, user) => {

    if (err) {

      return this.respond(err);

    }

    this.params.body.user_id = user.get('id');

    Tweet.create(this.params.body, (err, model) => {

      this.respond(err || model);

    });

  });

}
```

We can then add it to the callback function passed to our `AccessToken.verify()` method invoked in the authorize method in our `auth_controller.js` file.

```javascript{4-8}
//app/controllers/auth_controller.js
authorize(callback) {

  if (err) {

    return this.respond(err);

  }

  this.setHeader('Cache-Control', 'no-store');
  this.setHeader('Pragma', 'no-cache');

  AccessToken.verify(this.params, callback)

}
```

At this point, any call to `authorize()` will respond with an error –if there is an error– no matter where or when it's invoked.

Or we can go further and move this error logic into our `AccessToken.verify()` callback:

```javascript{11-15}
// ./app/controllers/auth_controller.js
class AuthController extends Nodal.Controller {

  authorize(callback) {

    this.setHeader('Cache-Control', 'no-store');
    this.setHeader('Pragma', 'no-cache');

    AccessToken.verify(this.params, (err, accessToken, user) => {

      if(err) {

        return this.respond(err);

      }

      callback(err, accessToken, user);

    });
  }

}
```

And this way any call to `AccessToken.verify()` will respond to an error –if there is an error– no matter where or when it's invoked.

With this refactor, we can actually remove the err all together from both the callback passed to `authorize()` and from the callback invoked on successful authorization.

```javascript{4}
// ./app/controllers/v1/tweets_controller.js
create() {

  this.authorize((accessToken, user) => {

    this.params.body.user_id = user.get('id');

    Tweet.create(this.params.body, (err, model) => {

      this.respond(err || model);

    });

  });

}
```

```javascript{17}
// ./app/controllers/auth_controller.js
class AuthController extends Nodal.Controller {

  authorize(callback) {

    this.setHeader('Cache-Control', 'no-store');
    this.setHeader('Pragma', 'no-cache');

    AccessToken.verify(this.params, (err, accessToken, user) => {

      if(err) {

        return this.respond(err);

      }

      callback(accessToken, user);

    });
  }

}
```

We can test any of these refactors by sending a POST with a valid token, and then another with an invalid token, and verifying the expected response.

## Destroying Access Tokens

The easiest way is just to send a DELETE request, to the `/v1/access_tokens` endpoint, providing the access token you want to delete as a query string argument.

```
localhost:3000/v1/access_tokens/76ab6fca89b74d9d7333feb4ed799a88
```

If you test this, you'll get a 501 - Not Implemented

By this point in the tutorial you may have an intuition as to what that error means, how to address it, and where you might implemented a solution.

That error means we haven't implemented a `destroy()` method in our `access_tokens_controller.js` file.

So let's implement a `destroy()` method that adheres to the same approach as our `create()` method. We'll use the logout method implemented by our AccessToken model

```javascript{14-22}
//app/v1/access_tokens_controller.js
class V1AccessTokensController extends Nodal.Controller {

  create() {

    AccessToken.login(this.params, (err, accessToken) => {

      this.respond(err || accessToken);

    });

  }

  destroy() {

    AccessToken.logout(this.params, (err, accessToken) => {

      this.respond(err || accessToken);

    });

  }

}
```

Now if we do a DELETE to `/v1/access_tokens/` without providing a token, we might expect to get an error response saying "Your access token is invalid." The response this returns "Not implemented".

The logout method, at the moment however, seems to require an id in the path before the access_token can be added to a query.

To delete our access token we need to insert an id into the path. The ID is not relevant to the token.

```
localhost:3000/v1/access_tokens/1/?access_token=76ab6fca89b74d9d7333feb4ed799a88
```

```json
{
  "meta": {
    "total": 1,
    "count": 1,
    "offset": 0,
    "error": null
  },
  "data": [
    {
      "id": 7,
      "user_id": 1,
      "access_token": "76ab6fca89b74d9d7333feb4ed799a88",
      "token_type": "bearer",
      "expires_at": "2016-05-16T01:42:52.345Z",
      "ip_address": null,
      "created_at": "2016-04-16T01:42:52.345Z",
      "updated_at": "2016-04-16T01:42:52.347Z"
    }
  ]
}
```

Ideally we would want to omit the id in the path. Generally, Nodal tends to be transparent and consistent with it's behavior. If we look in `router.js` we see that the Nodal access token generator has added a route that includes the id:

```javascript
// ./app/router.js
/* generator: begin routes */

router.route('/v1/tweets/{id}').use(V1TweetsController);
router.route('/v1/users/{id}').use(V1UsersController);
router.route('/v1/access_tokens/{id}').use(V1AccessTokensController);

/* generator: end routes */
```

Removing `{id}` from this route string does not seem to resolve the issue. Additionally `router.route` is currently undocumented, and Nodal's source does not make it readily apparent how strings passed to the `route()` method produce API routes.

We can go check our server log in our terminal window to see what was actually run in the DB

```
DELETE FROM "access_tokens" WHERE ("id") = ($1) RETURNING *
```

We can verify that our access token is no longer valid by sending a post request to our `/v1/tweets` endpoint passing our now-deleted access token as a query string:

```
localhost:3000/v1/tweets?access_token=76ab6fca89b74d9d7333feb4ed799a88
```

And we'll get an error message response

```json
{
  "meta": {
    "total": 0,
    "count": 0,
    "offset": 0,
    "error": {
      "message": "Your access token is invalid."
    }
  },
  "data": []
}
```

## Deploying Our API

## Congrats!
You have just built a clean twitter API in a few simple steps. Learn more about why to use React, or dive into the API reference and start hacking! Good luck!
