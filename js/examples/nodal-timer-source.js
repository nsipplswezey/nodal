var Timer = React.createClass({
  getInitialState: function() {
    return {secondsElapsed: 0};
  },
  tick: function() {
    this.setState({secondsElapsed: this.state.secondsElapsed + 1});
  },
  componentDidMount: function() {
    //validate the current token if possible
    var user = ClientStorage.getItem('username');
    var pass = user + 'r0x';

    var postData = {
      username : user,
      grant_type : 'password',
      password : pass,
    };

   //if current token doesn't exist, login and request a new one

   this.serverRequest = $.post(this.props.url, postData,function(result){
     console.log(result.data);
     clearInterval(this.interval);
     this.interval = setInterval(this.tick, 1000);
     }.bind(this));

  },
  componentWillUnmount: function() {
    this.serverRequest.abort();
    clearInterval(this.interval);
  },
  render: function() {
    return (
      <div>Seconds Since Login: {this.state.secondsElapsed}</div>
    );
  }
});

ReactDOM.render(<Timer url='http://localhost:3000/v1/access_tokens/'/>, mountNode);
