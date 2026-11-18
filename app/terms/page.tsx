import Link from 'next/link';

export const metadata = {
  title: 'Terms of Use | SpinTradeHub',
  description: 'Terms of Use for the SpinTradeHub B2B marketplace.',
};

const sections = [
  {
    title: '1. About SpinTradeHub',
    body: 'SpinTradeHub is an online B2B marketplace that helps industrial buyers and suppliers discover products, publish listings and communicate with each other. By using the website or app you agree to these Terms.',
  },
  {
    title: '2. Accounts',
    body: 'You must provide accurate information when creating an account and keep your login details secure. You are responsible for all activity under your account. We may suspend or remove accounts that violate these Terms.',
  },
  {
    title: '3. Listings and Content',
    body: 'Sellers are responsible for the accuracy, legality and ownership of the products, descriptions, images and other content they post. You must not post misleading, counterfeit, illegal or infringing content. We may remove content at our discretion.',
  },
  {
    title: '4. Dealings Between Users',
    body: 'SpinTradeHub provides a platform for businesses to connect. Any agreement, quotation, delivery or arrangement is made directly between buyer and seller. We are not a party to those dealings and do not guarantee the quality, safety or legality of listed products.',
  },
  {
    title: '5. Acceptable Use',
    body: 'You agree not to misuse the platform, including by spamming or harassing other users, attempting unauthorized access, scraping data, or interfering with the operation of the service.',
  },
  {
    title: '6. Privacy',
    body: 'We collect and use personal information only to operate and improve the service, such as account details, messages and listing data. We do not sell your personal information.',
  },
  {
    title: '7. Limitation of Liability',
    body: 'The service is provided "as is". To the extent permitted by law, SpinTradeHub is not liable for losses arising from your use of the platform or from dealings between users.',
  },
  {
    title: '8. Changes to These Terms',
    body: 'We may update these Terms from time to time. Continued use of the platform after changes means you accept the updated Terms.',
  },
  {
    title: '9. Contact',
    body: 'For more inquiries, email info@spintradehub.com or Customercare@spintradehub.com.',
  },
];

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '40px' }}>
      <header style={{ background: 'linear-gradient(135deg, #0056D2 0%, #003D9E 100%)', padding: '18px 16px' }}>
        <div style={{ width: '100%' }}>
          <Link href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Back Home</Link>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', margin: '10px 0 0' }}>Terms of Use</h1>
        </div>
      </header>
      <main style={{ margin: '24px 0 0', padding: '0 16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          {sections.map(section => (
            <section key={section.title} style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0056D2', margin: '0 0 6px' }}>{section.title}</h2>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.8, color: '#444' }}>{section.body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
