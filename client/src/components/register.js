import React from "react";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import validator from "validator";

class Register extends React.Component {
  constructor() {
    super();
    this.state = {};
  }
  handleChange = name => e => {
    this.setState({ [name]: e.target.value });
  }
  handleSubmit = async () => {
    const { username, password, email, confirmPassword, location } = this.state;
    if (!username) {
      return this.setState({ error: "Please provide a username" });
    }

    if (!email) {
      return this.setState({ error: "Please provide an email address" });
    }

    if (!validator.isEmail(email)) {
      return this.setState({ error: "Please provide a valid email address" });
    }

    if (!password) {
      return this.setState({ error: "Please provide a password" });
    }

    if (!confirmPassword) {
      return this.setState({ error: "You have to confirm your password" });
    }

    if (!password !== !confirmPassword) {
      return this.setState({ error: "Passwords do not match" });
    }

    try {
      const res = await fetch("/register", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ username, password, email, confirmPassword, location })
      });

      const result = await res.json();
      if (res.status === 200) {
        this.props.history.push("/");
        this.props.onLogin(result)
      } else {
        throw new Error(result.error)
      }
    } catch (e) {
      this.setState({ error: e.message });
    }
  }
  render() {
    const { username, password, email, confirmPassword, error, location } = this.state;
    return (
      <div style={{display: "flex", flexDirection: "column", alignItems: "center" }} >
        <form method="POST" action="/register" style={{ display: "flex", flexDirection: "column", alignContent: "center"}}>
          <TextField placeholder="Your Username..." label="Username" value={username || ""} required id="username" onChange={this.handleChange("username")} margin="dense" />
          <TextField placeholder="Your Email Address..." label="Email Address" value={email || ""} required id="email" onChange={this.handleChange("email")} margin="dense" />
          <TextField placeholder="Password..." type="password" label="Password" value={password || ""} required id="password" onChange={this.handleChange("password")} margin="dense" />
          <TextField placeholder="Confirm Password..." type="password" label="Confirm Password" value={confirmPassword || ""} required id="confirmPassword" onChange={this.handleChange("confirmPassword")} margin="dense" />
          <TextField placeholder="Enter your location..." label="Location" id="location" value={location || ""} margin="dense" onChange={this.handleChange("location")} />
          <Button variant="contained" onClick={this.handleSubmit}>Sign Up</Button>
        </form>
        {error && <Typography variant="body2" color="error">{error}</Typography>}
      </div>
    );
  }
}

export default Register;
