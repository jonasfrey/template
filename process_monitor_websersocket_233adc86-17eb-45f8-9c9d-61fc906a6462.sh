pid_websersocket=$(pgrep -f "websersocket_233adc86-17eb-45f8-9c9d-61fc906a6462.js")
watch -n 1 ps -p $pid_websersocket -o pid,etime,%cpu,%mem,cmd