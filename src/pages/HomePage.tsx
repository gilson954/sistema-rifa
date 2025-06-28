import React from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <FAQ />
      <Footer />
    </>
  );
};

export default HomePage;