const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Your Discord bot is active!'); 
});

// Start the web server
app.listen(port, () => {
  console.log(`Web server listening on port ${port}`);
});

require('dotenv').config();
const { Client, IntentsBitField, GatewayIntentBits } = require('discord.js');
const client = new Client({ 
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
      IntentsBitField.Flags.GuildVoiceStates,
    ] 
  });
  
  const token = process.env.TOKEN; // Replace with your bot token
  
  // Command prefix
  const prefix = '-';
  
  // In-memory database to store study times (use a real database for persistence)
  const userStudyTimes = {};
  
  client.once('ready', () => {
    console.log('Bot is online!');
  });
  
  client.on('messageCreate', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
  
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
  
    if (command === 'p') {
      // Handle the progress command
      handleProgressCommand(message);
    }
  });
  
  client.on('voiceStateUpdate', (oldState, newState) => {
    // Track when users join or leave a voice channel
    handleVoiceStateUpdate(oldState, newState);
  });
  
  client.login(token).catch(err => {
    console.error('Error logging in:', err);
  });
  
  // Helper function to handle progress command
  function handleProgressCommand(message) {
    const userId = message.author.id;
    const studyTime = userStudyTimes[userId]?.total || 0;
  
    // Assign roles based on study time
    assignRoleBasedOnStudyTime(message.member, studyTime);
  
    message.channel.send(`You have studied for ${studyTime} hours this month.`);
  }
  
  // Helper function to handle voice state updates
  function handleVoiceStateUpdate(oldState, newState) {
    if (!oldState.channel && newState.channel) {
      // User joined a voice channel
      startTracking(newState.member.id);
    } else if (oldState.channel && !newState.channel) {
      // User left a voice channel
      stopTracking(oldState.member.id);
    }
  }
  
  // Function to start tracking study time
  function startTracking(userId) {
    userStudyTimes[userId] = userStudyTimes[userId] || { total: 0 };
    userStudyTimes[userId].startTime = Date.now();
  }
  
  // Function to stop tracking study time
  function stopTracking(userId) {
    if (userStudyTimes[userId] && userStudyTimes[userId].startTime) {
      const endTime = Date.now();
      const startTime = userStudyTimes[userId].startTime;
      const studyDuration = (endTime - startTime) / (1000 * 60 * 60); // Convert to hours
  
      userStudyTimes[userId].total += studyDuration;
      delete userStudyTimes[userId].startTime;
    }
  }
  
  // Function to assign roles based on study time
  async function assignRoleBasedOnStudyTime(member, studyTime) {
    const roles = [
      { name: 'Novice Scholar', minHours: 0, maxHours: 10, color: '#FF0000' },
      { name: 'Apprentice Scholar', minHours: 10, maxHours: 20, color: '#FF4500' },
      { name: 'Junior Scholar', minHours: 20, maxHours: 30, color: '#FF8C00' },
      { name: 'Adept Scholar', minHours: 30, maxHours: 40, color: '#FFD700' },
      { name: 'Skilled Scholar', minHours: 40, maxHours: 50, color: '#ADFF2F' },
      { name: 'Seasoned Scholar', minHours: 50, maxHours: 60, color: '#7FFF00' },
      { name: 'Advanced Scholar', minHours: 60, maxHours: 70, color: '#32CD32' },
      { name: 'Expert Scholar', minHours: 70, maxHours: 80, color: '#00FA9A' },
      { name: 'Master Scholar', minHours: 80, maxHours: 90, color: '#00CED1' },
      { name: 'Senior Scholar', minHours: 90, maxHours: 100, color: '#4682B4' },
      { name: 'Elite Scholar', minHours: 100, maxHours: 110, color: '#1E90FF' },
      { name: 'Prodigious Scholar', minHours: 110, maxHours: 120, color: '#0000FF' },
      { name: 'Renowned Scholar', minHours: 120, maxHours: 130, color: '#8A2BE2' },
      { name: 'Legendary Scholar', minHours: 130, maxHours: 140, color: '#9400D3' },
      { name: 'Eminent Scholar', minHours: 140, maxHours: 150, color: '#8B0000' }
    ];
  
    for (const role of roles) {
      try {
        let discordRole = member.guild.roles.cache.find(r => r.name === role.name);
        if (!discordRole) {
          discordRole = await member.guild.roles.create({
            name: role.name,
            color: role.color,
            reason: 'Study role based on hours',
          });
        }
        if (studyTime >= role.minHours && studyTime < role.maxHours) {
          await member.roles.add(discordRole);
        } else {
          if (discordRole) {
            await member.roles.remove(discordRole);
          }
        }
      } catch (error) {
        console.error(`Failed to assign role ${role.name} to ${member.id}:`, error);
      }
    }
  }