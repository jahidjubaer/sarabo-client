import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import Reveal from '../../../components/public/Reveal';
import SectionHeader from '../../../components/public/SectionHeader';
import { buttonVariants } from '../../../components/ui/button-variants';
import { countServiceAreas } from '../../../utils/serviceAreaPresentation';

// "Do you cover my district?" in one line and one search box. The number is
// counted from serviceAreas.json (the route loader); searching hands off to
// the Service Areas map with the query applied.
const AreasTeaser = ({ areas }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const total = countServiceAreas(areas);
    if (total === 0) return null;

    const submit = (event) => {
        event.preventDefault();
        const q = query.trim();
        navigate(q ? `/service-areas?q=${encodeURIComponent(q)}` : '/service-areas');
    };

    return (
        <section aria-labelledby="home-areas-heading" className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
            <Reveal className="mx-auto grid max-w-6xl items-center gap-8 rounded-ds-xl bg-ds-accent p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14 lg:p-14">
                <SectionHeader
                    id="home-areas-heading"
                    eyebrow="Coverage"
                    title={`Repairs across ${total} districts`}
                    description="Search your area to see what is covered."
                />
                <div>
                    <form role="search" onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
                        <label htmlFor="home-area-search" className="sr-only">Search your district or area</label>
                        <div className="flex h-12 min-w-0 items-center gap-2 rounded-ds border border-ds-input bg-ds-card px-4 focus-within:ring-2 focus-within:ring-ds-ring sm:flex-1">
                            <MapPin aria-hidden="true" className="size-5 shrink-0 text-ds-primary" />
                            <input
                                id="home-area-search"
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="e.g. Mirpur, Sylhet, Khulna"
                                className="min-w-0 flex-1 bg-transparent text-body text-ds-foreground outline-none placeholder:text-ds-muted-foreground"
                            />
                        </div>
                        <button type="submit" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
                            <Search aria-hidden="true" /> Search
                        </button>
                    </form>
                    <Link to="/service-areas" className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded-ds text-body-sm font-semibold text-ds-primary hover:underline">
                        Open the coverage map <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                </div>
            </Reveal>
        </section>
    );
};

export default AreasTeaser;
