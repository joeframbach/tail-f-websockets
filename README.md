tail-f-websockets
=================

Follow multiple log files and push updates to multiple clients.

Use github authentication or ldap, or none at all.

Modify the log before sending it, for anonymization, formatting, etc.

Users may follow or unfollow files.

Installation notes:

npm installs current versions of express and everyauth, which use different versions of session.
My working setup uses express@0.2.32, express@2.5.9, socket.io@0.9.6.

TODO:

* ldap auth
* no auth
* client side
