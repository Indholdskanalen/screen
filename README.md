> [!Important]
> ### This project is no longer actively maintained.
> The source code in this repository is no longer maintained. It has been superseded by [version 2](https://os2display.github.io/display-docs/), which offers improved features and better support.
> 
> Thank you to all who have contributed to this project. We recommend transitioning to [Os2Display version 2](https://os2display.github.io/display-docs/) for continued support and updates.
> 
> **Final Release**: The final stable release is version [5.0.4](https://github.com/os2display/screen/releases/tag/5.0.4)
> 
<br>


# !!! Deprecation warning !!!
This repository has been included in the administration as a bundle in os2display 6.1.0.
https://github.com/os2display/admin/blob/master/CHANGELOG.md#610

No new development will not be made in this repository.

# Aroskanalen screen

# Introduction
This is a javascript client for aroskanalen dislpay systems. For more information see https://github.com/aroskanalen/docs/blob/development/Installation%20guide.md in the docs repository on github.com.

# Flow
1. The index.html loads all resources starts the indexController.
2. The indexController starts the socket.js which sets up the connection with the middleware.
     * if there exists a token in the cookie the connection is resumed with this token.
     * else the activation page is shown where the screen is activated
3. After the screen is activated, it receives the data for the screen (template and options),
   and the channels for the given screen.
4. The screen template is loaded from the backend. This contains a number of regions.
5. Each region has an id.
6. When a channel is received it is emitted with the 'addChannel' event.
7. Each region receives this event. If the channel.region matches the region the channel is added. If not it is removed if it exists.
8. Each region contains a number of channels that are looped. Each channel contains a number of slides which are displayed one at a time.
