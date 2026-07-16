import "./Features.css";
import {
    FaShoppingCart,
    FaTag,
    FaGift,
    FaExchangeAlt,
} from "react-icons/fa";
function Features() {
    return (
        <section className="features" id="features">
            <div className="container">

                <div className="features-heading text-center">
                    <span className="section-tag">FEATURES</span>

                    <h2>Everything You Need</h2>

                    <p>
                        Buy, Sell, Donate and Exchange items safely within your campus.
                    </p>
                </div>

                <div className="row g-4 mt-4">

                    <div className="col-lg-3 col-md-6">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaShoppingCart />
                            </div>

                            <h4>Buy</h4>

                            <p>
                                Purchase books, gadgets and essentials from students.
                            </p>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaExchangeAlt />
                            </div>

                            <h4>Exchange</h4>

                            <p>
                                Swap items with classmates instead of spending money.
                            </p>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaGift />
                            </div>

                            <h4>Donate</h4>

                            <p>
                                Help juniors by donating useful items you no longer need.
                            </p>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaTag />
                            </div>

                            <h4>Sell</h4>

                            <p>
                                List your unused items and earn money within your campus.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default Features;