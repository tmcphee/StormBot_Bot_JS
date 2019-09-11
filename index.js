const Commando = require('discord.js-commando');
const path = require('path');
const sqlite = require('sqlite');
var _ = require('lodash');
const config = require('./config.json')
const package = require('./package.json')
var Tracker = require('./Monitor/Tracker.js')
var System = require('./System.js')

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
 
  System.data.srvlog('Database connected as threadID: ' + con.threadId);
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
    System.data.srvlog(`Logged in as ${client.user.tag}`)
    client.user.setActivity('test')

})

client.on('message', msg => {//TESTED WORKING
    if (msg.author == client.user){
        return 
    }
    Tracker.data.MessageTracker(msg, con)
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
    Tracker.data.VoiceTracker(oldMember, newMember, con)
});


client.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
    con.query(`INSERT INTO discordguilds (GuildID, GuildName) VALUES(?, ?)`, [guild.id, guild.name]);

    /*POPULATE USERS TABLE*/
    guild.members.forEach(member => {
        System.data.AddMember(member, con)
    });
    /*END POPULATE USERS TABLE*/

})
  
client.on("guildDelete", guild => {
    console.log("Left guild: " + guild.name);
    con.query(`DELETE FROM discordguilds where GuildID=(?)`, [guild.id]);
})

client.on('error', console.error)

client.setProvider(
    sqlite.open(path.join(__dirname, 'settings.sqlite3')).then(db => new Commando.SQLiteProvider(db))
).catch(console.error);

function myFunction() {
    console.log("sup")
}

//client.setInterval(myFunction, 10000) //loop task (function, Delay ms, args)

client.login(config.token);