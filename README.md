twilio-taskrouter-worker.js
===============

twilio-taskrouter-worker.js allows you to manage Workers in the browser.

Note that this is a preview release. You may encounter bugs and instability, and
the APIs available in this release may change in subsequent releases.

**We want your feedback!** Email Kris Gutta, Product Manager for TaskRouter
at [kgutta@twilio.com](mailto:kgutta@twilio.com) with suggested
improvements, feature requests and general feedback. If you need technical
support, contact [help@twilio.com](mailto:help@twilio.com).

Installation
------------

### NPM

```
npm install twilio-taskrouter-worker --save
```

### CDN

Releases of twilio-taskrouter-worker.js are hosted on a CDN, and you can include these
directly in your web app using a &lt;script&gt; tag.

```html
<script src="//media.twiliocdn.com/sdk/js/taskrouter-worker/v2/twilio-taskrouter-worker.min.js"></script>
```

Usage
-----

The following is a simple example showing a Worker waiting for Reservations.
For more information, refer to the
[API Docs](//media.twiliocdn.com/sdk/js/taskrouter-worker/v1/docs).

```js
const alice = new Twilio.TaskRouter.Worker(token);

alice.on('ready', (readyAlice) => {
    console.log('Worker ' + readyAlice.sid + ' is now ready for work');
});

alice.on('reservationCreated', (reservation) => {
    console.log('Reservation ' + reservation.sid + ' has been created for ' + alice.sid);

    reservation.getTask().then((task) => {
      console.log('Task attributes are: ' + task.attributes);
    });

    reservation.on('accepted', (acceptedReservation) => {
      console.log('Reservation ' + acceptedReservation.sid + ' was accepted.');
    });

    reservation.accept().then((acceptedReservation) => {
      console.log('Reservation status is ' + acceptedReservation.status);
    }).catch((err) => {
      console.log('Error: ' + err);
    });
});

```

Changelog
---------

See [CHANGELOG.md](https://code.hq.twilio.com/wli/twilio-taskrouter-worker.js/blob/2.0.0-prev/CHANGELOG.md).

License
-------

See [LICENSE.md](https://code.hq.twilio.com/wli/twilio-taskrouter-worker.js/blob/2.0.0-prev/LICENSE.md).

Building
--------

Fork and clone the repository. Then, install dependencies with

```
npm install
```

Then run the `build` script:

```
npm run build
```

The builds and docs will be placed in the `dist/` directory.

Contributing
------------

Bug fixes welcome! If you're not familiar with the GitHub pull
request/contribution process,
[this is a nice tutorial](https://gun.io/blog/how-to-github-fork-branch-and-pull-request/).
