import React from "react";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import Chip from "@material-ui/core/Chip";

class Users extends React.Component {
  constructor() {
    super();
    this.state = { loading: true, users: [] };
  }
  async componentDidMount() {
    try {
      const res = await fetch("/users");
      const result = await res.json();

      if (res.status === 200) {
        this.setState({ users: result.users, loading: false });
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      this.setState({ error: "Could not fetch users. Please try again later", loading: false });
    }
  }
  render() {
    const { error, users, loading } = this.state;
    return (
      <div>
        {loading && <Typography variant="display2">Loading...</Typography>}
        {!loading && <List>
        {users.length ? users.map(user => (
          <ListItem key={user.username} alignItems="flex-start">
            <ListItemAvatar>
              <Avatar src="" />
            </ListItemAvatar>
            <ListItemText primary={user.username}
              secondary={user.location ? `City: ${user.location}` : "Unknown location"} />
            <Chip label={user.username} />
          </ListItem>
        )) : <Typography variant="display1">There are no users found.</Typography>}
      </List>}
        {error && <Typography color="error" variant="body2">{error}</Typography>}
      </div>
    );
  }
}

export default Users;
