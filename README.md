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
