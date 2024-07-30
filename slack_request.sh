curl -X POST -d "token=gIkuvaNzQIHg97ATvDxqgjtO \
&enterprise_id=E0001 \
&enterprise_name=Globular%20Construct%20Inc \
&user_id=U2147483697 \
&user_name=Steve \
&command=/whodidwhat \
&text=subscribe nhsapp web/**/*.js \
&response_url=https://hooks.slack.com/commands/1234/5678 \
&trigger_id=13345224609.738474920.8088930838d88f008e0 \
&api_app_id=A123456" \
http://localhost:7071/api/slackTrigger
