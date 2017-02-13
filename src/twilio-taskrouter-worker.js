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
    root.Twilio.TaskRouter = root.Twilio.TaskRouter || function TaskRouter() { };
    root.Twilio.TaskRouter.Worker = root.Twilio.TaskRouter.Worker || Worker;
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
