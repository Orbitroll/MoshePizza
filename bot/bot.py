from key import secret
from discord.ext import commands
import discord

bot_token = secret
channel_id = 1415057046281388122


bot = commands.Bot(command_prefix='%', intents=discord.Intents.all)

