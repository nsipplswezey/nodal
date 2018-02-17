
var HelloMessage = React.createClass({
  getInitialState: function() {
    return {username: ''};
  },

  componentDidMount: function() {

    this.serverRequest = $.get(this.props.source, function (result) {
      var lastUser = result.data[result.data.length - 1];
      var nextUserId = lastUser ? lastUser.id + 1 : 1;
      var nextUserName = 'user_' + nextUserId;

      var postData = {
        username: nextUserName,
        email: nextUserName + '@domain.com',
        password: nextUserName + 'r0x'
      };

      $.post(this.props.source, postData, function(result){
        ClientStorage.setItem('username',result.data[0].username);
        this.setState({username: ClientStorage.getItem('username')});
      }.bind(this))
      .fail(function(jqXHR, textStatus, errorThrown){
        console.error(jqXHR.responseText);
      });

    }.bind(this));

  },

  componentWillUnmount: function() {
    this.serverRequest.abort();
  },

  render: function() {
    return <div>Hello {this.state.username}!</div>;
  }
});

ReactDOM.render(<HelloMessage source='http://localhost:3000/v1/users/' />, mountNode);
