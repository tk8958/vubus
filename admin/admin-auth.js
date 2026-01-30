// admin-auth.js

// Ensure auth & db are already loaded from firebase-config.js

auth.onAuthStateChanged(user => {
    if (!user) {
        alert("Please login as admin first!");
        window.location.replace("admin-login.html"); // back button block
        return;
    }

    db.ref("users/" + user.uid + "/role")
      .once("value")
      .then(snapshot => {
          if (snapshot.val() !== "admin") {
              alert("Access Denied: Admins only");
              auth.signOut();
              window.location.replace("../index.html");
          }
      })
      .catch(err => {
          console.error(err);
          auth.signOut();
          window.location.replace("admin-login.html");
      });
});
