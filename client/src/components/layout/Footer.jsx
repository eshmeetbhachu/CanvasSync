import { FiGithub } from "react-icons/fi";
import { GITHUB_URL } from "../../constants/links";
import Logo from "../ui/Logo";

function Footer() {
    return (
        <footer className="border-t border-sand">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <Logo />

                <p className="text-sm text-olive">
                    Built by Eshmeet Singh · {new Date().getFullYear()}
                </p>

                <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-olive hover:text-ink"
                >
                    <FiGithub aria-hidden="true" />
                    Source on GitHub
                </a>
            </div>
        </footer>
    );
}

export default Footer;
