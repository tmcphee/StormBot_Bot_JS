const Commando = require('discord.js-commando');
const path = require('path');
const sqlite = require('sqlite');
const config = require('./config.json')
const package = require('./package.json')

/***********************************MYSQL*DATABASE***********************************/
var mysql = require('mysql');
var con = mysql.createConnection({
  host     : config.host,
  user     : config.user,
  password : config.password,
  database : config.database
});
 
con.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    console.log("Connection to database could not be established")
    process.exit(1);
    return;
  }
 
  console.log('Database connected as threadID: ' + con.threadId);
});

/************************************************************************************/

const client = new Commando.Client({
    commandPrefix: config.defaultPrefix,
    owner: config.owner
});

client.registry
    .registerDefaultTypes()
    // Registers your custom command groups
    .registerGroups([
        ['misc', 'Misc'],
        ['moderation', 'Moderation']
    ])

    // Registers all built-in groups, commands, and argument types
    .registerDefaultGroups()
    .registerDefaultCommands()

    // Registers all of your commands in the ./commands/ directory
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', async() => {
    console.log(`Logged in as ${client.user.tag}`)
    client.user.setActivity('test')
})

client.on('message', msg => {
    console.log('Message')
});

client.on('voiceStateUpdate', member => {
    console.log('Message')
});

client.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
    con.query(`INSERT INTO discordguilds (GuildID, GuildName) VALUES(?, ?)`, [guild.id, guild.name]);
})
  
client.on("guildDelete", guild => {
    console.log("Left guild: " + guild.name);
    con.query(`DELETE FROM discordguilds where GuildID=(?)`, [guild.id]);
})

client.on('error', console.error)

client.setProvider(
    sqlite.open(path.join(__dirname, 'settings.sqlite3')).then(db => new Commando.SQLiteProvider(db))
).catch(console.error);

client.login(config.token);