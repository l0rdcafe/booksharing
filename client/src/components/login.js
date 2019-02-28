import React from "react";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import validator from "validator";

class Login extends React.Component {
  constructor() {
    super();
    this.state = {};
  }
  handleChange = name => e => {
    this.setState({ [name]: e.target.value });
  }
  handleSubmit = async () => {
    const { username, email, password } = this.state;
    if (!username) {
      return this.setState({ error: "Please provide a valid and registered username" });
    }

    if (!email) {
      return this.setState({ error: "Please provide a valid and registered email address" });
    }

    if (!validator.isEmail(email)) {
      return this.setState({ error: "Please provide a valid email address" });
    }

    if (!password) {
      return this.setState({ error: "Please provide the password associated with this account" });
    }

    try {
      const res = await fetch("/login", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ username, email, password })
      });
      const result = await res.json();
      if (res.status === 200) {
        this.props.history.push("/");
        this.props.onLogin(result);
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      this.setState({ error: e.message });
    }
  }
  render() {
    const { username, email, password, error } = this.state;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <form method="POST" action="/login" style={{ display: "flex", flexDirection: "column", alignContent: "center"}}>
          <TextField label="Username" margin="dense" placeholder="Your Username..." id="username" onChange={this.handleChange("username")} value={username || ""} required />
          <TextField label="Email" margin="dense" placeholder="Your Email Address..." id="email" onChange={this.handleChange("email")} value={email || ""} required />
          <TextField label="Password" type="password" margin="dense" placeholder="Enter your Password..." id="password" onChange={this.handleChange("password")} value={password || ""} required />
          <Button variant="contained" onClick={this.handleSubmit}>Login</Button>
        </form>
        {error && <Typography color="error" variant="body2">{error}</Typography>}
      </div>
    );
  }
}

export default Login;
