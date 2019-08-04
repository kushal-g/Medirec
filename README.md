# Medirec

This project aims to reduce the communication gap that may occur between a doctor and a patient during treatment by keeping read-only medical records of all patients in a central database. Only doctors can add an entry which can to someone's medical records but even they cannot edit a saved record. If a doctor prescribes some medicines, the app also automatically orders the medicines and set reminders according to doctor's prescription

# Languages used

- HTML

- CSS

- Javascript


# Database used
- MongoDB

# Third party libraries used

- [jQuery](https://jquery.com/)
- [Bootstrap](https://getbootstrap.com/)
- [Node.js](https://nodejs.org/en/)
- [Express](https://expressjs.com/)
- [EJS](https://ejs.co/)
- [body-parser](https://www.npmjs.com/package/body-parser)
- [request](https://www.npmjs.com/package/request)
- [mongoose](https://mongoosejs.com/)
- [Passport](http://www.passportjs.org/)
- [Lodash](https://lodash.com/)
- [socket.io](https://socket.io/)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [bower](https://bower.io/)
- [validator.js](https://github.com/validatorjs/validator.js)

## What currently works


- Registration and Log in of users either locally or through Google or Facebook.

- Doctors can view all the patients that are under their treatment.

> However, there is no way to upgrade to Doctor account from usual account currently ~~or even to add patients under their treatment~~. Set the "doc_acc" property of a user to true to manually upgrade.

- Doctors can search to add new patients

- Doctors can now send request to add a patient under their treatment
> The user to whom request is sent cannot accept yet

