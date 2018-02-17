'use strict';

var TIMER_COMPONENT = "\nvar Timer = React.createClass({\n  getInitialState: function() {\n    return {secondsElapsed: 0};\n  },\n  tick: function() {\n    this.setState({secondsElapsed: this.state.secondsElapsed + 1});\n  },\n  componentDidMount: function() {\n    //validate the current token if possible\n    var user = ClientStorage.getItem('username');\n    var pass = user + 'r0x';\n\n    var postData = {\n      username : user,\n      grant_type : 'password',\n      password : pass,\n    };\n\n   //if current token doesn't exist, login and request a new one\n\n   this.serverRequest = $.post(this.props.url, postData,function(result){\n     console.log(result.data);\n     clearInterval(this.interval);\n     this.interval = setInterval(this.tick, 1000);\n     }.bind(this));\n\n  },\n  componentWillUnmount: function() {\n    this.serverRequest.abort();\n    clearInterval(this.interval);\n  },\n  render: function() {\n    return (\n      <div>Seconds Since Login: {this.state.secondsElapsed}</div>\n    );\n  }\n});\n\nReactDOM.render(<Timer url='http://localhost:3000/v1/access_tokens/'/>, mountNode);\n";


ReactDOM.render(React.createElement(ReactPlayground, { codeText: TIMER_COMPONENT }), document.getElementById('timerExample'));


//sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/\\n/g' nodal-timer-source.js | sed -e "s/.*/\"\\\n&\\\n\"/" > nodal-timer-string.js
/*
For now, feed nodal-timer-source.js to that insane sed one liner up there...

Then paste the output nodal-timer-string.js into the var EXAMPLE_COMPONENT

Hah. Totally insane. Fix this for later. Or do it once, and hide it. Or something. Jesus.

*/
