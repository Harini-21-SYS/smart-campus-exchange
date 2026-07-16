import Navbar from "../../components/NavBar/NavBar";
import Home from "../../components/Home/Home"
import About from "../../components/About/About"
import Features from "../../components/Features/Features"
import Contact from "../../components/Contact/Contact"
import Footer from "../../components/Footer/Footer"
function Landing(){
    return(
        <>
        <Navbar />
        <Home />
        <About />
        <Features />
        <Contact />
        <Footer />
        </>
    )
}
export default Landing