import { ClipboardList, ReceiptText, Route } from 'lucide-react';
import repairPhoto from '../../assets/hero-repair-1920.jpg';
import CTABand from '../../components/public/CTABand';

const VALUES = [
    { title: 'Convenient repair requests', copy: 'Describe your device and the fault in one request.', icon: <ClipboardList aria-hidden="true" className="size-6" /> },
    { title: 'Transparent quotations', copy: 'Review an itemised quote after inspection, before approving the repair.', icon: <ReceiptText aria-hidden="true" className="size-6" /> },
    { title: 'Trackable progress', copy: 'Follow your repair updates and confirm receipt when your device is back.', icon: <Route aria-hidden="true" className="size-6" /> },
];

const About = () => (
    <div>
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
                <header className="min-w-0">
                    <p className="ds-label text-ds-primary">About Sarabo</p>
                    <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ds-foreground sm:text-4xl lg:text-display">A clearer way to arrange a repair.</h1>
                    <p className="mt-5 max-w-xl text-body text-ds-muted-foreground">Sarabo brings electronics and appliance repair requests, quotations and progress updates into one place, so you can understand the next step for your device.</p>
                </header>
                <img src={repairPhoto} alt="Electronics repair work at a technician's workbench" width="1920" height="1280" className="aspect-[4/3] w-full rounded-ds-lg border border-ds-border object-cover object-center" />
            </div>
        </section>
        <section aria-label="What Sarabo helps you do" className="px-4 pb-12 sm:px-6 lg:px-8 lg:pb-20">
            <div className="mx-auto grid max-w-6xl gap-6 border-t border-ds-border pt-8 md:grid-cols-3 md:gap-8">
                {VALUES.map((value) => (
                    <div key={value.title} className="min-w-0">
                        <span className="text-ds-primary">{value.icon}</span>
                        <h2 className="mt-4 text-heading text-ds-foreground">{value.title}</h2>
                        <p className="mt-2 text-body-sm text-ds-muted-foreground">{value.copy}</p>
                    </div>
                ))}
            </div>
        </section>
        <CTABand heading="Let's take the next step." description="Choose a service or tell us what needs repair." />
    </div>
);

export default About;
