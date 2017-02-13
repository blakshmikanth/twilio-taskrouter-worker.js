/*! $name.js $version
$license
 */
/* eslint strict:0 */
(function(root) {
  var bundle = $bundle;
  var Worker = bundle($entry);
  /* globals define */
  if (typeof define === 'function' && define.amd) {
    define([], function() { return Worker; });
  } else {
    root.Twilio = root.Twilio || function Twilio() { };
    root.Twilio.TaskRouter = root.Twilio.TaskRouter || function Twilio() { };
    Twilio.TaskRouter.Worker = Twilio.Worker || Worker;
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
