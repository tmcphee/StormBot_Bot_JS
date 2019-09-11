var System = require('../System.js')

var methods = {};
methods.MessageTracker = function(msg, con){
    con.query(`SELECT * FROM DiscordUsers WHERE DiscordID="` + msg.author.id + `" and ServerID="` + msg.guild.id + `"`, (err, DUser) => {
        if (DUser.length == 0){
            System.data.AddMember(msg.author, con)
        }
        
        con.query(`SELECT * FROM DiscordActivity WHERE DiscordID="` + msg.author.id + `" and ServerID="` + msg.guild.id + `" and ChannelID="` + msg.channel.id + `" and timestampdiff(DAY, ActivityDate, now()) = 0`, (err, DActivity) => {
            if (DActivity.length == 0){
                con.query(`INSERT INTO DiscordActivity (DiscordID, ChannelID, MSG, ServerID) VALUES(?, ?, ?, ?)`, 
                [msg.author.id, msg.channel.id, 1, msg.guild.id]);
            }else{
                con.query(`UPDATE DiscordActivity SET MSG=MSG + ? WHERE DiscordID=? and ChannelID=? and ServerID=? and timestampdiff(DAY, ActivityDate, now()) = 0`, 
                [1, msg.author.id, msg.channel.id, msg.guild.id]);
            }
        }); 
    });
}

methods.VoiceTracker = function(oldMember, newMember, con){
    try{
        con.query(`SELECT * FROM DiscordUsers WHERE DiscordID="` + msg.author.id + `" and ServerID="` + msg.guild.id + `"`, (err, DUser) => {
            if (DUser.length == 0){
                System.data.AddMember(msg.author, con)
            }

            var member = newMember
            if(newMember.voiceChannel === undefined){
                member = oldMember
            }
            let after = newMember
            let before = oldMember

            con.query(`SELECT ChannelID FROM blockedchannels WHERE ChannelType=1 and ServerID="` + member.guild.id + `"`, async(err, BlockedChannels) => {
                let oldUserChannel = oldMember.voiceChannel;
                let newUserChannel = newMember.voiceChannel;

                var channel = after.voiceChannel
                var mem = after
                if(after.voiceChannel === undefined){
                    channel = before.voiceChannel
                    mem = before
                }
                if(channel.id in BlockedChannels){
                    checkvoicetemp(mem, con)
                    return
                }else{
                    
                    var d = Date.now()
                    if (oldUserChannel === undefined) {
                        con.query(`INSERT INTO voicetemp (DiscordID, ChannelID, ServerID, StartTime) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE ChannelID=?, StartTime =?`, [newMember.id, newUserChannel.id, newMember.guild.id, d, newUserChannel.id, d]);
                    } else if (newUserChannel === undefined) {
                        checkvoicetemp(member, con)
                        con.query(`DELETE FROM voicetemp WHERE DiscordID=? and ServerID=?`, [member.id, member.guild.id]);
                    } else if (oldUserChannel && newUserChannel && oldUserChannel.id != newUserChannel.id) {
                        await checkvoicetemp(newMember, con)
                        con.query(`INSERT INTO voicetemp (DiscordID, ChannelID, ServerID, StartTime) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE ChannelID=?, StartTime =?`, [newMember.id, newUserChannel.id, newMember.guild.id, d, newUserChannel.id, d]);
                    }
                }
            });
        });
    }catch(error){
        System.data.srvlog("SEVERE ERROR ON [voiceStateUpdate] --> ENDING TASK")
    }
}

function checkvoicetemp(member, con){
    try{
        con.query(`SELECT * FROM voicetemp WHERE DiscordID="` + member.id + `" and ServerID="` + member.guild.id + `"`, (err, StartTime) => {
            if (StartTime.length == 0){
                return
            }else{
                var d = Date.now()
                var millis = Date.now() - StartTime[0]['StartTime']
                var diff = Math.floor(millis/60000)
                if (diff != 0){
                    con.query(`SELECT * FROM DiscordActivity WHERE DiscordID="` + member.id + `" and ServerID="` + member.guild.id + `" and ChannelID="` + member.voiceChannel.id + `" and timestampdiff(DAY, ActivityDate, now()) = 0`, (err, DActivity) => {
                        if (DActivity.length == 0){
                            con.query(`INSERT INTO DiscordActivity (DiscordID, ChannelID, VOIP, ServerID) VALUES(?, ?, ?, ?)`, 
                            [member.id, member.voiceChannel.id, diff, member.guild.id]);
                        }else{
                            con.query(`UPDATE DiscordActivity SET VOIP=VOIP + ? WHERE DiscordID=? and ChannelID=? and ServerID=? and timestampdiff(DAY, ActivityDate, now()) = 0`, 
                            [diff, member.id, member.voiceChannel.id, member.guild.id]);
                        }
                    });
                }
            }
        });
    }catch(error){
        System.data.srvlog("SEVERE ERROR ON [checkvoicetemp] --> ENDING TASK")
    }
}

exports.data = methods;