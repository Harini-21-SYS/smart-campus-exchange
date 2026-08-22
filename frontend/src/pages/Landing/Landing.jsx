import Navbar from "../../components/NavBar/NavBar";
// NOTE: adjust this import path to wherever StudentNavbar.jsx actually
// lives — this assumes it's colocated with StudentDashboard.jsx, e.g.
// src/pages/StudentDashboard/StudentNavbar.jsx, with Landing.jsx as a
// sibling under src/pages/Landing/Landing.jsx.
import StudentNavbar from "../student/StudentNavbar";
import Home from "../../components/Home/Home"
import About from "../../components/About/About"
import Features from "../../components/Features/Features"
import Contact from "../../components/Contact/Contact"
import Footer from "../../components/Footer/Footer"

function Landing(){
    // A logged-in student clicking "Home" from the dashboard lands back
    // here — but should keep seeing their own navbar, not the public
    // marketing one. The public Navbar is for signed-out visitors only.
    const isLoggedIn = Boolean(localStorage.getItem("token"));

    return(
        <>
        {isLoggedIn ? <StudentNavbar activeId="home" /> : <Navbar />}
        <Home />
        <About />
        <Features />
        <Contact />
        <Footer />
        </>
    )
}
export default Landing