var config = {};

/**
 * Github Authentication
 ***********************
 * Register your github application at github.com/settings/applications.
 *   URL: http://<server_ip>:<server_port>
 *   Callback URL: http://<server_ip>:<server_port>
 * Github will generate your App ID and App Secret.
 ***********************
 * All authentication rules here are optional:
 *   organization: ['YourOrganization', ...]
 *   whitelist: ['joeschmoe', 'herpderp', ...]
 *   blacklist: ['personanongrata', 'formercoworkers', ...]
 */
config.auth = {
  type: 'github'
 ,app_id: '0123456789abcdef'
 ,app_secret: '0123456789abcdef0123456789abcdef'
 ,organization: ['ShowClix']
};

/**
 * LDAP Authentication
 *********************
 * You must provide your own LDAP server.
 *********************
 * config.auth = {
 *   type: 'ldap'
 *  ,scheme: 'ldap'
 *  ,host: 'some.ldap.server'
 *  ,port: 389
 *  ,base: 'OU=FOO,DC=US,DC=BAR,DC=com'
 *  ,filter: '(&(objectclass=user)(sAMAccountName=someone)'
 * };
 */

/**
 * File Parsing
 **************
 * List which files you want to expose to the client.
 * Provide an optional function to modify the line before sending.
 **************
 * config.files.push({
 *   display_name: 'Display Name'
 *  ,filename: '/path/to/the/file'
 *  ,markup: function(line) {
 *     // Turn urls into hyperlinks, only in one part of the log line.
 *     var groups = line.match(/^\[([a-zA-Z0-9: ]+)\] \[(error|warning|notice)\] \[client ([0-9.]+)\] (.*)$/);
 *     groups[4].replace(/ (https?:\/\/[^ ]+) /g, ' <a href="$1">$1</a> ');
 *     return groups.join(' ');
 *   }
 * });
 */

config.files = [];

config.files.push({
  display_name: 'Error Logs'
 ,filename: '/var/log/apache2/error.log'
 ,markup: function(line) {
    var groups = line.match(/^([^ ]+) \[([a-zA-Z0-9: ]+)\] \[(error|warning|notice)\] \[client ([0-9.]+)\] (.*)$/);
    groups[3] = groups[3].touppercase();
    groups[5].replace(/ (https?:\/\/[^ ]+) /g,' <a href="$1">$1</a> ');
    groups[5].replace(/in \/root\/showclix(\/home\/showclix[^ ]+) on line ([0-9]+)/g,
                      '<a href="https://www.github.com/ShowClix/ShowClix/blob/master/$1">$1</a>');
    return groups.join(' ');
  }
});

config.files.push({
  display_name: 'Access Logs'
 ,filename: '/var/log/apache2/access.log'
});

config.session_secret = 'SE$S!0N$3CR3T';

module.exports = config;
