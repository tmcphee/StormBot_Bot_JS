var methods = {};
methods.AddMember = function(member, con) {
    try{
        //srvlog("Added " + member.user.username + " to database")
        console.log("Added " + member.user.username + " to database")
        var userroles = [];
        member.roles.forEach(role => 
            userroles.push({RoleID: role.id, RoleName: role.name, RoleColour: role.hexColor})
        );
        con.query(`INSERT INTO discordusers VALUES (?, ?, ?, ?, ?, ?, ?, ?) `,
        [member.id, member.user.username, _.padStart(member.user.discriminator, 4, '0'), member.nickname, JSON.stringify(userroles), member.user.avatar, message.guild.id, member.joinedAt])
        return true
    }catch(error){
        return false
    }
}

methods.srvlog = function(msg){
    var d = new Date();
    console.log("" + d.getMonth() + "/" + d.getDate() + "/" + d.getFullYear()
     + " (" + d.getHours() + ":" + d.getMinutes() + ":" + d.getMilliseconds() + ") --> " + msg)
}

exports.data = methods;