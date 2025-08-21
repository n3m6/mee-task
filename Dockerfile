FROM ghcr.io/foundry-rs/foundry:latest
ENV PATH="/root/.foundry/bin:${PATH}"
EXPOSE 8545
COPY --chmod=0755 entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
