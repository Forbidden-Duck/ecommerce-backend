# Ecommerce Website - Backend

This project acts as https://ecommerce.harrisonhoward.xyz backend code.\
The website was created as a portfolio project and nothing that takes place on the site is verified (i.e. email verification).

## Host It Myself

### Database

> This project requires [MongoDB](https://www.mongodb.com/) for it's database. All collections and schemas are auto-generated.

### Environment Variables

All variables are required (modify based on your environment)

> _PORT_=NUMBER **(i.e. 6001)**\
> _PROTOCOL_=STRING **(http or https)**\
> _ENV_=STRING **(dev or production)**

> _DBNAME_=STRING **(i.e. ecommerce)**\
> _DBHOST_=STRING **(i.e. localhost:27017)**\
> _DBUSERNAME_=STRING **(i.e. EcommerceUser)**\
> _DBPASSWORD_=STRING **(i.e. SuperStrongPassword123)**

> _SKSECRET_=STRING **(Stripe Secret Key (sk_test\_..))**\
> _JWTKEY_=STRING **(Any randomised string, used to verify tokens)**

### Development Environment

Script `npm run start` will start the backend. Use this for connecting the backend and frontend together in the development environment

### Production Environment

Ensure the frontend has been built. Setup your environment variables and place the `/build` folder into the server root directory. To use `HTTPS` create a folder called `/cert` and place your `cert.pem` & `key.pem` into that folder

## Scripts

### start

`npm run start`\
Start a development version of the project.

### test

`npm run test`\
Run the development tests _(beware they are outdated with the latest route changes and improvements)_

## Schemas

### Users

> \_id [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> email [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> password [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> authedGoogle [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)\
> firstname [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> lastname [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> admin [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)\
> createdAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)\
> modifiedAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

### Products

> \_id [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> name [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> description [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> price [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)\
> createdAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)\
> modifiedAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

### Carts

> \_id [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> userid [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> items [CartItem<Array\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)\
> createdAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)\
> modifiedAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

### CartItem (Hidden Schema)

> \_id [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> productid [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> quantity [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)\
> price [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)\
> createdAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)\
> modifiedAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

### Orders

> \_id [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> userid [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> status [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> total [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)\
> payment [StripeCharge<Object\>](https://stripe.com/docs/api/charges/create) | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> items [OrderItem<Array\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)\
> createdAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)\
> modifiedAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

### OrderItem (Hidden Schema)

> \_id [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> productid [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> quantity [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)\
> price [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)\
> createdAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)\
> modifiedAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

### Refresh_tokens

> \_id [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> userid [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> createdAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

### Iplog

> \_id [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> address [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)\
> count [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)\
> createdAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)\
> modifiedAt [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

## Routes

For testing routes with `Postman` or similar. (Requires cookies enabled for persistent session)

### `/auth`

> POST `/register`
>
> > body.email [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body.password [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body.firstname [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > body.lastname [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > response.body `UsersSchema`

> POST `/login`
>
> > body.email [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body.password [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) `{user: UsersSchema, token: string, expiresIn: number, refreshtoken: string}`\
> > response.cookie **refresh_token**

> POST `/google`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body.email [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body.firstname [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body.lastname [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) `{user: UsersSchema, token: string, expiresIn: number, refreshtoken: string}`\
> > response.cookie **refresh_token**

> POST `/refresh_token`
>
> > cookies.refresh_token **REQUIRED**\
> > response.body [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) `{user: UsersSchema, token: string, expiresIn: number, refreshtoken: string}`\
> > response.cookie **refresh_token**

> POST `/logout`\
>
> > cookies.refresh_token **REQUIRED**

### `/api/user`

> GET `/`\
> Requires `admin`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body `UsersSchema<Array>`

> GET `/:userid`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body `UsersSchema`

> PUT `/:userid`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body.password [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body.user.email [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > body.user.firstname [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > body.user.lastname [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > response.body `UsersSchema`

> DELETE `/:userid`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body.password [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**

### `/api/product`

> GET `/`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body `ProductsSchema`\
> > response.body `ProductsSchema<Array>`

> GET `/:productid`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body `ProductsSchema`

> POST `/`\
> Requires `admin`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \
> > body<span>.</span>name [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > body.description [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > body.price [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) **REQUIRED**

> PUT `/:productid`\
> Requires `admin`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body<span>.</span>name [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > body.description [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > body.price [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) **OPTIONAL**\
> > response.body `ProductsSchema`

> DELETE `/:productid`\
> Requires `admin`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**

### `/api/cart`

> GET `/`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body `CartsSchema<Array>`

> POST `/`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body `CartsSchema`

> GET `/:cartid`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body `CartsSchema<Array>`

> POST `/:cartid/items`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body.productid [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > body.quantity [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > body.price [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > response.body [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) `{cart: CartsSchema, cartitem: CartItemSchema}`

> PUT `/:cartid/items/:cartitemid`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > body.productid [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > body.quantity [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > body.price [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **OPTIONAL**\
> > response.body [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) `{cart: CartsSchema, cartitem: CartItemSchema}`

> DELETE `/:cartid/items/:cartitemid`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) `{cart: CartsSchema, cartitem: CartItemSchema}`

> POST `/:cartid/checkout`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) `{order: OrdersSchema, charge: StripeCharge<Object>}`

### `/api/order`

> GET `/`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body `OrderssSchema<Array>`

> GET `/:orderid`
>
> > header.authorization [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) **REQUIRED**\
> > response.body `OrdersSchema`
