# language: YAML
name: Restart Chat Application

# Workflow metadata
# Short description: Restarts the chat service safely
# Hashtag: #RestartChatApp

on:
  workflow_dispatch:  # Allows manual trigger from GitHub Actions UI
    inputs:
      chat_description:
        description: 'A short description of the chat application'
        required: true
        default: 'My chat service'
  schedule:              # Optional: run on a schedule (e.g., daily at 2am)
    - cron: '0 2 * * *'

jobs:
  restart_chat:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Set Environment Variables
        run: |
          echo "APP_NAME=my-chat-app" >> $GITHUB_ENV
          echo "CHAT_DESC='${{ github.event.inputs.chat_description }}'" >> $GITHUB_ENV
          echo "HASHTAG='#RestartChatApp'" >> $GITHUB_ENV

      - name: Display Chat Info
        run: |
          echo "Restarting chat: $CHAT_DESC $HASHTAG"

      - name: Restart Docker Container
        if: env.APP_NAME != ''
        run: |
          if docker ps -a | grep -q "$APP_NAME"; then
              echo "Stopping existing container $APP_NAME"
              docker stop $APP_NAME
              echo "Starting container $APP_NAME"
              docker start $APP_NAME
          else
              echo "Container $APP_NAME not found. Optionally run: docker run -d --name $APP_NAME your-image"
          fi

      - name: Optional: Restart Systemd Service
        if: github.event.inputs.chat_description == 'systemd'
        run: |
          echo "Restarting systemd service $APP_NAME"
          sudo systemctl restart "$APP_NAME"

      - name: Confirm Restart Complete
        run: echo "Chat application '$CHAT_DESC' restarted successfully! $Oddych chat"
        