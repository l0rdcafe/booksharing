import React, { Component } from 'react';
import { Route, Redirect } from "react-router-dom";
import Typography from "@material-ui/core/Typography";
import Nav from "./nav"
import Books from "./books";
import Users from "./users";
import Requests from "./requests";
import Trades from "./trades";
import Login from "./login";
import Register from "./register";
import Me from "./me";
import NewReq from "./new-req";

class App extends Component {
  constructor() {
    super();
    this.state = { loading: true, books: [] };
  }
  async componentDidMount() {
    try {
      const res = await fetch("/sessions", {
        credentials: "include"
      });

      const result = await res.json();
      if (res.status === 200) {
        this.setState({ user: result, loading: false });
      } else if (res.status === 404) {
        this.setState({ loading: false });
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      this.setState({ error: "Could not authenticate user. Please try again later.", loading: false });
    }
  }
  logout = async () => {
    try {
      const res = await fetch("/logout", {
        headers: { "Content-Type": "application/json" },
        include: "credentials",
        method: "POST"
      });

      if (res.status === 204) {
        this.setState({ user: null });
      } else {
        const result = await res.json();
        throw new Error(result.error);
      }
    } catch (e) {
      this.setState({ error: "Could not log user out. Please try again later." });
    }
  }
  onLogin = user => {
    this.setState({ user });
  }
  render() {
    const { user, loading } = this.state;
    return (
      <div>
        <Nav loading={loading} isLoggedIn={user ? true : false} logout={user ? this.logout : () => {}} />
        <Route exact path="/" render={() => (
          <React.Fragment>
            {!loading && <Typography variant="display2">{user ? `Welcome, ${user.username}!` : "Hey there! Login to share books." }</Typography>}
            <Books userId={user && user.id} />
          </React.Fragment>
        )} />
      <Route exact path="/books" render={(props) => <Books {...props} userId={user && user.id} />} />
        <Route path="/users" component={Users} />
        <Route exact path="/requests" component={Requests} />
        <Route path="/trades" component={Trades} />
        <Route path="/login" component={props => <Login {...props} onLogin={this.onLogin} />} />
        <Route path="/register" render={props => <Register {...props} onLogin={this.onLogin} />} />
        {user && !loading && <Route path="/login" render={props => <Redirect to="/me" />} />}
        {user && !loading && <Route path="/register" render={props => <Redirect to="/me" />} />}
        {user && <Route path="/me" render={props => <Me {...props} />} />}
        {!user && !loading && <Route path="/me" render={props => <Redirect to="/login" />} />}
        {user && <Route path="/requests/new" render={props => <NewReq {...props} user={{ username: user.username, location: user.location, id: user.id }} />} />}
        {!user && !loading && <Route path="/requests/new" render={(props) => <Redirect to="/login" />} />}
      </div>
    );
  }
}

export default App;
